import { Injectable } from '@nestjs/common';
import { prisma, ReportStatus } from '@sn8/database';

export type StatsOverview = {
  totalReports: number;
  approvedReports: number;
  pendingReports: number;
  totalTargets: number;
  highRiskTargets: number;
};

export type FraudTypeStat = {
  type: string;
  label: string;
  count: number;
  percentage: number;
};

export type ChannelStat = {
  channel: string;
  label: string;
  count: number;
  percentage: number;
};

export type TimelineStat = {
  date: string;
  count: number;
};

export type TopTargetStat = {
  id: string;
  displayPhone: string;
  totalReports: number;
  lastReportAt: string | null;
};

export type FullStats = {
  overview: StatsOverview;
  byFraudType: FraudTypeStat[];
  byChannel: ChannelStat[];
  timeline: TimelineStat[];
  topTargets: TopTargetStat[];
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
export class StatsService {
  async getFullStats(): Promise<FullStats> {
    const [
      overview,
      byFraudType,
      byChannel,
      timeline,
      topTargets,
    ] = await Promise.all([
      this.getOverview(),
      this.getByFraudType(),
      this.getByChannel(),
      this.getTimeline(),
      this.getTopTargets(),
    ]);

    return {
      overview,
      byFraudType,
      byChannel,
      timeline,
      topTargets,
    };
  }

  private async getOverview(): Promise<StatsOverview> {
    const [
      totalReports,
      approvedReports,
      pendingReports,
      totalTargets,
      highRiskTargets,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: ReportStatus.approved } }),
      prisma.report.count({ where: { status: ReportStatus.pending } }),
      prisma.reportTarget.count(),
      prisma.reportTarget.count({ where: { riskLevelSnapshot: 'high' } }),
    ]);

    return {
      totalReports,
      approvedReports,
      pendingReports,
      totalTargets,
      highRiskTargets,
    };
  }

  private async getByFraudType(): Promise<FraudTypeStat[]> {
    const results = await prisma.report.groupBy({
      by: ['fraudType'],
      _count: { id: true },
    });

    const total = results.reduce((sum, r) => sum + r._count.id, 0);

    return results.map((r) => ({
      type: r.fraudType,
      label: fraudTypeLabels[r.fraudType] || r.fraudType,
      count: r._count.id,
      percentage: total > 0 ? Math.round((r._count.id / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }

  private async getByChannel(): Promise<ChannelStat[]> {
    const results = await prisma.report.groupBy({
      by: ['channel'],
      _count: { id: true },
    });

    const total = results.reduce((sum, r) => sum + r._count.id, 0);

    return results.map((r) => ({
      channel: r.channel,
      label: channelLabels[r.channel] || r.channel,
      count: r._count.id,
      percentage: total > 0 ? Math.round((r._count.id / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }

  private async getTimeline(): Promise<TimelineStat[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reports = await prisma.report.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by date
    const grouped = new Map<string, number>();
    
    // Helper to get date key
    const getDateKey = (date: Date): string => date.toISOString().slice(0, 10);
    
    // Initialize all dates with 0
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      grouped.set(getDateKey(d), 0);
    }

    // Count reports per date
    reports.forEach((r) => {
      const dateKey = getDateKey(r.createdAt);
      grouped.set(dateKey, (grouped.get(dateKey) || 0) + 1);
    });

    // Convert to array and sort by date
    return Array.from(grouped.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getTopTargets(): Promise<TopTargetStat[]> {
    const targets = await prisma.reportTarget.findMany({
      where: {
        totalApprovedReports: { gt: 0 },
      },
      orderBy: { totalApprovedReports: 'desc' },
      take: 10,
      select: {
        id: true,
        displayPhoneMasked: true,
        totalApprovedReports: true,
        lastReportAt: true,
      },
    });

    return targets.map((t) => ({
      id: t.id,
      displayPhone: t.displayPhoneMasked,
      totalReports: t.totalApprovedReports,
      lastReportAt: t.lastReportAt?.toISOString() ?? null,
    }));
  }
}
