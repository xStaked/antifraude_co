import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AdminService, DashboardStats, PendingReport } from './admin.service';
import { ModerationActionDto } from './admin.dto';
import { AdminJwtAuthGuard } from '../auth/admin-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuditLogService } from '../../shared/audit/audit-log.service';
import { HttpRequest } from '../../shared/http/http-request';

@Controller('admin')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('dashboard-stats')
  @HttpCode(HttpStatus.OK)
  async getDashboardStats(): Promise<DashboardStats> {
    return this.adminService.getDashboardStats();
  }

  @Get('pending-reports')
  @HttpCode(HttpStatus.OK)
  async getPendingReports(): Promise<PendingReport[]> {
    return this.adminService.getPendingReports();
  }

  @Get('reports/:id')
  @HttpCode(HttpStatus.OK)
  async getReportById(@Param('id') id: string) {
    return this.adminService.getReportById(id);
  }

  @Post('reports/:id/actions')
  @HttpCode(HttpStatus.OK)
  async createAction(
    @Param('id') reportId: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser('id') adminUserId: string,
    @Req() req: HttpRequest,
  ) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const rawUserAgent = req.headers['user-agent'];

    const result = await this.adminService.createModerationAction(reportId, adminUserId, dto);

    await this.auditLog.log({
      action: 'moderation_action',
      method: req.method,
      path: req.originalUrl ?? req.url,
      ip: (typeof forwardedFor === 'string' ? forwardedFor : undefined) || req.ip || 'unknown',
      userAgent: typeof rawUserAgent === 'string' ? rawUserAgent : undefined,
      adminUserId,
      metadata: { reportId, actionType: dto.actionType },
    });

    return result;
  }
}
