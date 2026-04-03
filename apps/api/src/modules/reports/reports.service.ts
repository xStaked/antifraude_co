import {
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma, ReportStatus, Prisma } from '@sn8/database';
import { normalizeColombianPhone, maskColombianPhone } from '../../shared/utils/phone';
import { S3Service } from '../files/s3.service';
import { CreateReportDto, EvidenceItemDto, PresignedUrlDto } from './reports.dto';
import { createHash, randomUUID } from 'crypto';
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, () => []);
  for (let i = 0; i <= b.length; i++) matrix[i]![0] = i;
  for (let j = 0; j <= a.length; j++) matrix[0]![j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i]![j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1]![j - 1]!
          : Math.min(
              matrix[i - 1]![j - 1]! + 1,
              matrix[i]![j - 1]! + 1,
              matrix[i - 1]![j]! + 1,
            );
    }
  }
  return matrix[b.length]![a.length]!;
}

function similarityPercent(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const dist = levenshteinDistance(a, b);
  return ((maxLen - dist) / maxLen) * 100;
}

function computeDedupHash(
  normalizedPhone: string,
  amountCents: bigint | null,
  incidentDate: string,
  fraudType: string,
  channel: string,
): string {
  const payload = `${normalizedPhone}:${amountCents?.toString() ?? 'NULL'}:${incidentDate}:${fraudType}:${channel}`;
  return createHash('sha256').update(payload).digest('hex');
}

function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

@Injectable()
export class ReportsService {
  private readonly redis: Redis;
  private readonly limiterHour: RateLimiterRedis;
  private readonly limiterDay: RateLimiterRedis;
  private readonly turnstileSecretKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly s3: S3Service,
  ) {
    const redisUrl = this.config.get<string>('redisUrl') ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);

    this.limiterHour = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'report_limit_hour',
      points: 2,
      duration: 60 * 60, // 1 hour
    });

    this.limiterDay = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'report_limit_day',
      points: 5,
      duration: 24 * 60 * 60, // 24 hours
    });

    this.turnstileSecretKey = this.config.get<string>('turnstileSecretKey') ?? '';
  }

  async validateCaptcha(token: string): Promise<void> {
    if (!this.turnstileSecretKey) {
      // Skip validation if not configured (local dev)
      return;
    }
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: this.turnstileSecretKey,
        response: token,
      }),
    });
    const data = await res.json().catch(() => ({ success: false }));
    if (!data.success) {
      throw new BadRequestException('Captcha no válido. Intenta de nuevo.');
    }
  }

  async checkRateLimits(req: any): Promise<void> {
    // Skip rate limiting in development
    const nodeEnv = this.config.get<string>('nodeEnv') ?? 'development';
    if (nodeEnv === 'development') {
      return;
    }
    
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    try {
      await this.limiterHour.consume(ipHash);
    } catch {
      throw new ConflictException('Demasiados reportes desde esta dirección. Intenta más tarde.');
    }
    try {
      await this.limiterDay.consume(ipHash);
    } catch {
      throw new ConflictException('Límite diario de reportes alcanzado.');
    }
  }

  async getPresignedUrl(dto: PresignedUrlDto) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(dto.mimeType)) {
      throw new BadRequestException('Solo se permiten imágenes JPEG o PNG.');
    }
    return this.s3.getPresignedUrl(dto.fileName, dto.mimeType, dto.size);
  }

  async uploadFile(file: Express.Multer.File) {
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const key = `reports/${randomUUID()}/${Date.now()}.${ext}`;
    
    // Calculate checksum
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    
    // Upload to S3/R2
    await this.s3.uploadBuffer(key, file.buffer, file.mimetype);
    
    const publicUrl = this.s3.getPublicUrl(key);
    
    return {
      publicUrl,
      key,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      checksum,
    };
  }

  async createReport(dto: CreateReportDto, req: any) {
    await this.checkRateLimits(req);
    if (dto.captchaToken) {
      await this.validateCaptcha(dto.captchaToken);
    }

    const normalizedPhone = normalizeColombianPhone(dto.phone);
    const amountCents = dto.amount != null ? BigInt(dto.amount * 100) : null;
    const incidentDate = new Date(dto.incidentDate);
    const reporterIpHash = hashIp(getClientIp(req));

    const dedupHash = computeDedupHash(
      normalizedPhone,
      amountCents,
      dto.incidentDate,
      dto.fraudType,
      dto.channel,
    );

    // 1. Hard dedup: same hash in last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingDuplicate = await prisma.report.findFirst({
      where: { dedupHash, createdAt: { gte: since } },
    });
    if (existingDuplicate) {
      throw new ConflictException('Ya existe un reporte similar en las últimas 24 horas.');
    }

    // 2. Soft dedup heuristic
    let status: ReportStatus = ReportStatus.pending;
    const target = await prisma.reportTarget.findUnique({
      where: { normalizedPhone },
    });

    if (target) {
      const similarReport = await prisma.report.findFirst({
        where: {
          targetId: target.id,
          createdAt: { gte: since },
          amountCents,
          incidentDate,
        },
      });
      if (similarReport && similarityPercent(dto.description, similarReport.description) > 85) {
        status = ReportStatus.flagged;
      }
    }

    // 3. Upsert target and create report in transaction
    const displayPhoneMasked = maskColombianPhone(normalizedPhone);
    const evidenceData = dto.evidence ?? [];

    const result = await prisma.$transaction(async (tx) => {
      const reportTarget = await tx.reportTarget.upsert({
        where: { normalizedPhone },
        update: {},
        create: {
          normalizedPhone,
          displayPhoneMasked,
        },
      });

      const report = await tx.report.create({
        data: {
          targetId: reportTarget.id,
          reporterIpHash,
          // Datos del reportante
          reporterBusinessName: dto.reporter.businessName,
          reporterDocumentId: dto.reporter.documentId,
          reporterPhone: dto.reporter.phone,
          reporterEmail: dto.reporter.email ?? null,
          // Datos del reportado
          reporterName: null,
          reportedName: dto.reportedName ?? null,
          amountCents,
          incidentDate,
          fraudType: dto.fraudType,
          channel: dto.channel,
          description: dto.description,
          status,
          dedupHash,
        },
      });

      if (evidenceData.length > 0) {
        await tx.reportEvidence.createMany({
          data: evidenceData.map((e: EvidenceItemDto) => ({
            reportId: report.id,
            fileUrl: e.fileUrl,
            fileType: e.mimeType,
            fileSize: e.fileSize,
            checksum: e.checksum,
          })),
        });
      }

      return { reportId: report.id, status, duplicateDetected: false };
    });

    return {
      reportId: result.reportId,
      status: result.status,
      message: status === ReportStatus.flagged
        ? 'Reporte recibido. Hemos detectado similitudes con otro reporte reciente y será revisado manualmente.'
        : 'Reporte recibido. Está en revisión.',
      duplicateDetected: false,
    };
  }
}
