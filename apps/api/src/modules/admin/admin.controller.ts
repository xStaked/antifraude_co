import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService, DashboardStats, PendingReport } from './admin.service';
import { ModerationActionDto } from './admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
  ) {
    // TODO: Obtener adminUserId del JWT token cuando se implemente auth
    // Por ahora obtenemos el primer admin disponible
    const adminUser = await this.adminService.getFirstAdmin();
    const adminUserId = adminUser.id;
    return this.adminService.createModerationAction(reportId, adminUserId, dto);
  }
}
