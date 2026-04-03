import { Injectable } from '@nestjs/common';
import { prisma, TrustEventReason } from '@sn8/database';

const TRUST_RULES = {
  PHONE_VERIFIED: 10,
  REPORT_APPROVED: 20,
  REPORT_REJECTED_FALSE: -50,
  DUPLICATE_ABUSE: -10,
};

@Injectable()
export class TrustScoreService {
  async applyPhoneVerified(userId: string): Promise<void> {
    await this.addEvent(userId, TrustEventReason.phone_verified, TRUST_RULES.PHONE_VERIFIED);
  }

  async applyApprovedReport(userId: string, reportId: string): Promise<void> {
    await this.addEvent(userId, TrustEventReason.report_approved, TRUST_RULES.REPORT_APPROVED, reportId);
  }

  async applyFalseReportPenalty(userId: string, reportId: string): Promise<void> {
    await this.addEvent(userId, TrustEventReason.report_rejected_false, TRUST_RULES.REPORT_REJECTED_FALSE, reportId);
  }

  async applyDuplicateAbuse(userId: string, reportId?: string): Promise<void> {
    await this.addEvent(userId, TrustEventReason.duplicate_abuse, TRUST_RULES.DUPLICATE_ABUSE, reportId);
  }

  async recalculateReviewPriority(
    userId: string,
    hasEvidence: boolean,
    abuseSignals: string[],
  ): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true, phoneVerified: true },
    });

    if (!user) {
      return 0;
    }

    let priority = user.trustScore;
    if (user.phoneVerified) priority += 10;
    if (hasEvidence) priority += 5;
    if (abuseSignals.length > 0) priority -= 30;

    return priority;
  }

  private async addEvent(userId: string, reason: TrustEventReason, delta: number, reportId?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.trustEvent.create({
        data: {
          userId,
          reportId: reportId ?? null,
          reason,
          delta,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { trustScore: { increment: delta } },
      });
    });
  }
}
