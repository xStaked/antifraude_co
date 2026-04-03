import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, ReportStatus, ReviewStatus, ActionType } from '@sn8/database';
import { ModerationActionDto } from './admin.dto';
import { TrustScoreService } from '../../shared/security/trust-score.service';

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
  reviewPriority: number;
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

function computeRiskLevel(totalApproved: number): string {
  if (totalApproved === 0) return 'none';
  if (totalApproved <= 2) return 'low';
  if (totalApproved <= 5) return 'medium';
  return 'high';
}

@Injectable()
export class AdminService {
  constructor(private readonly trustScore: TrustScoreService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingReports,
      approvedToday,
      totalReports,
      openReviewRequests,
    ] = await Promise.all([
      prisma.report.count({
        where: { status: ReportStatus.pending },
      }),
      prisma.report.count({
        where: {
          status: ReportStatus.approved,
          updatedAt: { gte: today },
        },
      }),
      prisma.report.count(),
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
      orderBy: [{ reviewPriority: 'desc' }, { createdAt: 'desc' }],
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
      reviewPriority: report.reviewPriority,
    }));
  }

  async getReportById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        target: true,
        evidence: true,
        user: {
          include: {
            trustEvents: true,
          },
        },
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

    const trustScore = report.user
      ? report.user.trustEvents.reduce((sum, e) => sum + e.delta, 0)
      : null;
    const userReportHistoryCount = report.user
      ? await prisma.report.count({ where: { userId: report.user.id } })
      : null;

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
      reviewPriority: report.reviewPriority,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      target: {
        id: report.target.id,
        riskScore: report.target.riskScoreSnapshot,
        riskLevel: report.target.riskLevelSnapshot,
        totalApprovedReports: report.target.totalApprovedReports,
      },
      reporter: report.user
        ? {
            userId: report.user.id,
            phoneVerified: report.user.phoneVerified,
            trustScore,
            totalReports: userReportHistoryCount,
            ipHash: report.reporterIpHash,
            userAgent: report.reporterUserAgent,
            flags: report.abuseFlags,
          }
        : {
            userId: null,
            phoneVerified: null,
            trustScore: null,
            totalReports: null,
            ipHash: report.reporterIpHash,
            userAgent: report.reporterUserAgent,
            flags: report.abuseFlags,
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
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { target: true, user: true },
    });

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (report.status !== ReportStatus.pending && report.status !== ReportStatus.flagged) {
      throw new BadRequestException('Este reporte ya fue moderado');
    }

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

    const result = await prisma.$transaction(async (tx) => {
      const action = await tx.moderationAction.create({
        data: {
          reportId,
          adminUserId,
          actionType: dto.actionType,
          note: dto.note,
        },
      });

      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: { status: newStatus },
      });

      if (dto.actionType === ActionType.approve) {
        const newTotal = report.target.totalApprovedReports + 1;
        await tx.reportTarget.update({
          where: { id: report.targetId },
          data: {
            totalApprovedReports: newTotal,
            lastReportAt: new Date(),
            riskScoreSnapshot: newTotal,
            riskLevelSnapshot: computeRiskLevel(newTotal) as any,
          },
        });
      }

      return { action, report: updatedReport };
    });

    // Async trust score updates
    if (dto.actionType === ActionType.approve && report.user) {
      setImmediate(() => {
        this.trustScore.applyApprovedReport(report.user!.id, reportId).catch(() => {});
      });
    }
    if (dto.actionType === ActionType.reject && report.user) {
      setImmediate(() => {
        this.trustScore.applyFalseReportPenalty(report.user!.id, reportId).catch(() => {});
      });
    }

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
