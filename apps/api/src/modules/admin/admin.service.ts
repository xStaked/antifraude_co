import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, ReportStatus, ReviewStatus, ActionType } from '@sn8/database';
import { ModerationActionDto } from './admin.dto';

export type DashboardStats = {
  pendingReports: number;
  approvedToday: number;
  totalReports: number;
  openReviewRequests: number;
};

export type PendingReport = {
  id: string;
  reportedPhone: string;
  fraudType: string;
  fraudTypeLabel: string;
  channel: string;
  channelLabel: string;
  date: string;
  status: string;
  description: string;
};

const fraudTypeLabels: Record<string, string> = {
  fake_voucher: 'Comprobante falso',
  not_reflected: 'Dinero no reflejado',
  attempt: 'Intento de estafa',
};

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook_marketplace: 'Facebook Marketplace',
  instagram: 'Instagram',
  other: 'Otro',
};

@Injectable()
export class AdminService {
  async getFirstAdmin() {
    const admin = await prisma.adminUser.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!admin) {
      throw new Error('No hay usuarios admin en el sistema');
    }
    return admin;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingReports,
      approvedToday,
      totalReports,
      openReviewRequests,
    ] = await Promise.all([
      // Reportes pendientes
      prisma.report.count({
        where: { status: ReportStatus.pending },
      }),
      // Aprobados hoy
      prisma.report.count({
        where: {
          status: ReportStatus.approved,
          updatedAt: { gte: today },
        },
      }),
      // Total de reportes
      prisma.report.count(),
      // Solicitudes de revisión abiertas
      prisma.reviewRequest.count({
        where: {
          status: { in: [ReviewStatus.open, ReviewStatus.in_review] },
        },
      }),
    ]);

    return {
      pendingReports,
      approvedToday,
      totalReports,
      openReviewRequests,
    };
  }

  async getPendingReports(limit: number = 10): Promise<PendingReport[]> {
    const reports = await prisma.report.findMany({
      where: { status: ReportStatus.pending },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        target: {
          select: {
            displayPhoneMasked: true,
          },
        },
      },
    });

    return reports.map((report) => ({
      id: report.id,
      reportedPhone: report.target.displayPhoneMasked,
      fraudType: report.fraudType,
      fraudTypeLabel: fraudTypeLabels[report.fraudType] || report.fraudType,
      channel: report.channel,
      channelLabel: channelLabels[report.channel] || report.channel,
      date: report.createdAt.toISOString(),
      status: report.status,
      description: report.description.slice(0, 100) + (report.description.length > 100 ? '...' : ''),
    }));
  }

  async getReportById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        target: true,
        evidence: true,
        actions: {
          include: {
            adminUser: {
              select: { email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) {
      throw new Error('Reporte no encontrado');
    }

    return {
      id: report.id,
      reportedPhone: report.target.displayPhoneMasked,
      normalizedPhone: report.target.normalizedPhone,
      fraudType: report.fraudType,
      fraudTypeLabel: fraudTypeLabels[report.fraudType] || report.fraudType,
      channel: report.channel,
      channelLabel: channelLabels[report.channel] || report.channel,
      description: report.description,
      reportedName: report.reportedName,
      amountCents: report.amountCents ? Number(report.amountCents) : null,
      incidentDate: report.incidentDate.toISOString(),
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      target: {
        id: report.target.id,
        riskScore: report.target.riskScoreSnapshot,
        riskLevel: report.target.riskLevelSnapshot,
        totalApprovedReports: report.target.totalApprovedReports,
      },
      evidence: report.evidence.map((e) => ({
        id: e.id,
        fileUrl: e.fileUrl,
        fileType: e.fileType,
        fileSize: e.fileSize,
      })),
      actions: report.actions.map((a) => ({
        id: a.id,
        actionType: a.actionType,
        note: a.note,
        createdAt: a.createdAt.toISOString(),
        adminEmail: a.adminUser.email,
      })),
    };
  }

  async createModerationAction(
    reportId: string,
    adminUserId: string,
    dto: ModerationActionDto,
  ) {
    // Verificar que el reporte existe
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { target: true },
    });

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    // Verificar que no está ya aprobado/rechazado
    if (report.status !== ReportStatus.pending && report.status !== ReportStatus.flagged) {
      throw new BadRequestException('Este reporte ya fue moderado');
    }

    // Determinar el nuevo status basado en la acción
    let newStatus: ReportStatus;
    switch (dto.actionType) {
      case ActionType.approve:
        newStatus = ReportStatus.approved;
        break;
      case ActionType.reject:
        newStatus = ReportStatus.rejected;
        break;
      case ActionType.hide:
        newStatus = ReportStatus.hidden;
        break;
      case ActionType.flag_duplicate:
        newStatus = ReportStatus.flagged;
        break;
      default:
        throw new BadRequestException('Tipo de acción no válido');
    }

    // Ejecutar en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear la acción de moderación
      const action = await tx.moderationAction.create({
        data: {
          reportId,
          adminUserId,
          actionType: dto.actionType,
          note: dto.note,
        },
      });

      // Actualizar el status del reporte
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: { status: newStatus },
      });

      // Si se aprueba, actualizar conteos del target
      if (dto.actionType === ActionType.approve) {
        await tx.reportTarget.update({
          where: { id: report.targetId },
          data: {
            totalApprovedReports: { increment: 1 },
            lastReportAt: new Date(),
          },
        });
      }

      return { action, report: updatedReport };
    });

    return {
      success: true,
      action: {
        id: result.action.id,
        actionType: result.action.actionType,
        note: result.action.note,
        createdAt: result.action.createdAt.toISOString(),
      },
      report: {
        id: result.report.id,
        status: result.report.status,
      },
    };
  }
}
