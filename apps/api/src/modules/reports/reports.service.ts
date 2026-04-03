import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma, ReportStatus } from '@sn8/database';
import { normalizeColombianPhone, maskColombianPhone } from '../../shared/utils/phone';
import { S3Service } from '../files/s3.service';
import { CreateReportDto, EvidenceItemDto, PresignedUrlDto } from './reports.dto';
import { createHash, randomUUID } from 'crypto';
import { TrustScoreService } from '../../shared/security/trust-score.service';
import { AbuseService } from '../../shared/security/abuse.service';
import { HttpRequest } from '../../shared/http/http-request';

function computeDedupHash(
  normalizedPhone: string,
  amountCents: bigint | null,
  incidentDate: string,
): string {
  const payload = `${normalizedPhone}:${amountCents?.toString() ?? 'NULL'}:${incidentDate}`;
  return createHash('sha256').update(payload).digest('hex');
}

function getClientIp(req: HttpRequest): string {
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
  private readonly turnstileSecretKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly s3: S3Service,
    private readonly trustScore: TrustScoreService,
    private readonly abuse: AbuseService,
  ) {
    this.turnstileSecretKey = this.config.get<string>('turnstileSecretKey') ?? '';
  }

  async validateCaptcha(token: string): Promise<void> {
    if (!this.turnstileSecretKey) {
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

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
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

  async createReport(
    dto: CreateReportDto,
    req: HttpRequest,
    user: { id: string; phone: string; email: string; fullName: string; documentNumber: string; phoneVerified: boolean; trustScore: number },
    userAgent?: string,
  ) {
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
    );

    // Hard dedup: same phone + amount + incidentDate in last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingDuplicate = await prisma.report.findFirst({
      where: { dedupHash, createdAt: { gte: since } },
    });
    if (existingDuplicate) {
      throw new ConflictException('Ya existe un reporte similar en las últimas 24 horas.');
    }

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

      const { signals: abuseSignals } = await this.abuse.detectAbuseSignals(user.id, reportTarget.id);
      let reviewPriority = await this.trustScore.recalculateReviewPriority(
        user.id,
        evidenceData.length > 0,
        abuseSignals,
      );

      let status: ReportStatus = ReportStatus.pending;
      if (abuseSignals.includes('burst')) {
        status = ReportStatus.flagged;
      }

      const report = await tx.report.create({
        data: {
          targetId: reportTarget.id,
          userId: user.id,
          reporterIpHash,
          reporterName: user.fullName,
          reportedName: dto.reportedName ?? null,
          amountCents,
          incidentDate,
          fraudType: dto.fraudType,
          channel: dto.channel,
          description: dto.description,
          status,
          reviewPriority,
          reporterUserAgent: userAgent ?? null,
          abuseFlags: abuseSignals.length > 0 ? (abuseSignals as any) : null,
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

      return { reportId: report.id, status, reviewPriority, abuseSignals, targetId: reportTarget.id };
    });

    // Async jobs after response
    setImmediate(() => {
      if (result.abuseSignals.length > 0) {
        this.trustScore.applyDuplicateAbuse(user.id, result.reportId).catch(() => {});
      }
    });

    return {
      reportId: result.reportId,
      status: result.status,
      message: result.status === ReportStatus.flagged
        ? 'Reporte recibido. Hemos detectado actividad inusual y será revisado manualmente.'
        : 'Reporte recibido. Está en revisión.',
      duplicateDetected: false,
    };
  }
}
