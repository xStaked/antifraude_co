import { Injectable } from '@nestjs/common';
import { prisma, ReportStatus } from '@sn8/database';
import { normalizeColombianPhone, maskColombianPhone } from '../../shared/utils/phone';

const DISCLAIMER =
  'La información publicada en esta plataforma proviene de reportes realizados por usuarios y tiene fines preventivos e informativos. No constituye una decisión judicial ni una acusación legal definitiva. Verifique siempre el pago directamente en su aplicación bancaria.';

export type SearchResult = {
  targetId: string;
  displayPhone: string;
  riskLevel: string;
  riskScore: number;
  totalApprovedReports: number;
  lastReportAt: string | null;
  recentReports: Array<{
    id: string;
    incidentDate: string;
    fraudType: string;
    channel: string;
    amountCents: string | null;
  }>;
  disclaimer: string;
};

@Injectable()
export class SearchService {
  async searchByPhone(rawPhone: string): Promise<SearchResult> {
    const normalized = normalizeColombianPhone(rawPhone);

    const target = await prisma.reportTarget.findUnique({
      where: { normalizedPhone: normalized },
    });

    if (!target) {
      return {
        targetId: '',
        displayPhone: maskColombianPhone(normalized),
        riskLevel: 'none',
        riskScore: 0,
        totalApprovedReports: 0,
        lastReportAt: null,
        recentReports: [],
        disclaimer: DISCLAIMER,
      };
    }

    const recentReports = await prisma.report.findMany({
      where: {
        targetId: target.id,
        status: ReportStatus.approved,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        incidentDate: true,
        fraudType: true,
        channel: true,
        amountCents: true,
      },
    });

    // Calculate risk level based on actual approved reports count
    const totalApproved = recentReports.length;
    const riskLevel = totalApproved === 0 ? 'none' : 
                      totalApproved <= 2 ? 'low' : 
                      totalApproved <= 5 ? 'medium' : 'high';

    return {
      targetId: target.id,
      displayPhone: target.displayPhoneMasked,
      riskLevel,
      riskScore: target.riskScoreSnapshot,
      totalApprovedReports: totalApproved,
      lastReportAt: target.lastReportAt?.toISOString() ?? null,
      recentReports: recentReports.map((r) => ({
        id: r.id,
        incidentDate: r.incidentDate.toISOString(),
        fraudType: r.fraudType,
        channel: r.channel,
        amountCents: r.amountCents?.toString() ?? null,
      })),
      disclaimer: DISCLAIMER,
    };
  }
}
