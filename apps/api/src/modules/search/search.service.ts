import { Injectable } from '@nestjs/common';
import { prisma, ReportStatus } from '@sn8/database';
import { normalizeColombianPhone, maskColombianPhone } from '../../shared/utils/phone';

const RECOMMENDATION = 'Verifica el pago en tu app antes de entregar';

export type SearchResult = {
  displayPhone: string;
  riskLevel: string;
  totalApprovedReports: number;
  recommendation: string;
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
        displayPhone: maskColombianPhone(normalized),
        riskLevel: 'none',
        totalApprovedReports: 0,
        recommendation: RECOMMENDATION,
      };
    }

    const totalApprovedReports = await prisma.report.count({
      where: {
        targetId: target.id,
        status: ReportStatus.approved,
      },
    });

    const riskLevel = totalApprovedReports === 0 ? 'none' :
                      totalApprovedReports <= 2 ? 'low' :
                      totalApprovedReports <= 5 ? 'medium' : 'high';

    return {
      displayPhone: target.displayPhoneMasked,
      riskLevel,
      totalApprovedReports,
      recommendation: RECOMMENDATION,
    };
  }
}
