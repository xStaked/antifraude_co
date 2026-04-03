import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminService, DashboardStats, PendingReport } from './admin.service';
import { ModerationActionDto } from './admin.dto';
import { AdminJwtAuthGuard } from '../auth/admin-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuditLogService } from '../../shared/audit/audit-log.service';

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
    @Req() req: Request,
  ) {
    const result = await this.adminService.createModerationAction(reportId, adminUserId, dto);

    await this.auditLog.log({
      action: 'moderation_action',
      method: req.method,
      path: req.originalUrl,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
      adminUserId,
      metadata: { reportId, actionType: dto.actionType },
    });

    return result;
  }
}
