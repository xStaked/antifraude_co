import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportDto, PresignedUrlDto } from './reports.dto';
import { AuditLogService } from '../../shared/audit/audit-log.service';
import { UserJwtAuthGuard } from '../auth/user-jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RateLimit, RateLimitGuard } from '../../shared/security/rate-limit.guard';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Post()
  @UseGuards(UserJwtAuthGuard, ThrottlerGuard, RateLimitGuard)
  @Throttle({ default: { limit: 5, ttl: 24 * 60 * 60 * 1000 } })
  @RateLimit({
    keyPrefix: 'report_user_day',
    points: 3,
    duration: 24 * 60 * 60,
    keyExtractor: (req) => req.user?.id ?? req.ip ?? 'unknown',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateReportDto,
    @Req() req: Request,
    @CurrentUser() user: { id: string; phone: string; email: string; fullName: string; documentNumber: string; phoneVerified: boolean; trustScore: number },
  ) {
    const userAgent = req.headers['user-agent'] as string | undefined;
    const result = await this.reportsService.createReport(dto, req, user, userAgent);

    await this.auditLog.log({
      action: 'create_report',
      method: req.method,
      path: req.originalUrl,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
      userAgent,
      metadata: { reportId: result.reportId, status: result.status, userId: user.id },
    });

    return result;
  }

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  async presignedUrl(@Body() dto: PresignedUrlDto) {
    return this.reportsService.getPresignedUrl(dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPEG o PNG');
    }
    
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('El archivo debe ser menor a 2 MB');
    }

    return this.reportsService.uploadFile(file);
  }
}
