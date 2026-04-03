import { Injectable } from '@nestjs/common';
import { prisma } from '@sn8/database';
import { createHash } from 'crypto';

@Injectable()
export class AuditLogService {
  private hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }

  async log(args: {
    action: string;
    method: string;
    path: string;
    ip: string;
    userAgent?: string;
    adminUserId?: string;
    metadata?: Record<string, unknown>;
  }) {
    await prisma.auditLog.create({
      data: {
        action: args.action,
        method: args.method,
        path: args.path,
        ipHash: this.hashIp(args.ip),
        userAgent: args.userAgent ?? null,
        adminUserId: args.adminUserId ?? null,
        metadata: args.metadata ? JSON.stringify(args.metadata) : null,
      },
    });
  }
}
