import { Module } from '@nestjs/common';
import { AuditLogService } from './audit/audit-log.service';
import { TrustScoreService } from './security/trust-score.service';
import { AbuseService } from './security/abuse.service';
import { RequestMetadataInterceptor } from './security/request-metadata.interceptor';
import { RateLimitGuard } from './security/rate-limit.guard';

@Module({
  providers: [AuditLogService, TrustScoreService, AbuseService, RequestMetadataInterceptor, RateLimitGuard],
  exports: [AuditLogService, TrustScoreService, AbuseService, RequestMetadataInterceptor, RateLimitGuard],
})
export class SharedModule {}
