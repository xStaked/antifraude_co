import { Injectable } from '@nestjs/common';
import { prisma } from '@sn8/database';

@Injectable()
export class AbuseService {
  async detectAbuseSignals(userId: string, targetId: string): Promise<{ signals: string[]; burstCount: number }> {
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000);
    const sinceDay = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [reportsLastHour, reportsSameTargetDay, reportsLastDay] = await Promise.all([
      prisma.report.count({
        where: { userId, createdAt: { gte: sinceHour } },
      }),
      prisma.report.count({
        where: { userId, targetId, createdAt: { gte: sinceDay } },
      }),
      prisma.report.count({
        where: { userId, createdAt: { gte: sinceDay } },
      }),
    ]);

    const signals: string[] = [];

    if (reportsLastHour >= 2) {
      signals.push('burst');
    }
    if (reportsSameTargetDay >= 1) {
      signals.push('same-target-repeat');
    }
    if (reportsLastDay >= 5) {
      signals.push('daily-limit-exceeded');
    }

    return { signals, burstCount: reportsLastHour };
  }
}
