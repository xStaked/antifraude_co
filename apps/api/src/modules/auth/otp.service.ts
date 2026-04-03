import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash, compare } from 'bcrypt';
import Redis from 'ioredis';
import { prisma } from '@sn8/database';

interface OtpRedisPayload {
  codeHash: string;
  userId: string;
  attempts: number;
}

@Injectable()
export class OtpService {
  private readonly redis: Redis;
  private readonly ttlSeconds = 600; // 10 minutos

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redisUrl') ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  async generateOtp(phone: string, userId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await hash(code, 10);
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    const payload: OtpRedisPayload = { codeHash, userId, attempts: 0 };
    await this.redis.setex(`otp:${phone}`, this.ttlSeconds, JSON.stringify(payload));

    // Persistir en DB para auditoría
    await prisma.otpChallenge.create({
      data: {
        userId,
        phone,
        codeHash,
        expiresAt,
      },
    });

    return code;
  }

  async verifyOtp(phone: string, code: string): Promise<{ valid: boolean; userId?: string }> {
    const raw = await this.redis.get(`otp:${phone}`);
    if (!raw) {
      return { valid: false };
    }

    const payload: OtpRedisPayload = JSON.parse(raw);
    payload.attempts += 1;

    if (payload.attempts >= 5) {
      await this.redis.del(`otp:${phone}`);
      return { valid: false };
    }

    const valid = await compare(code, payload.codeHash);
    if (!valid) {
      await this.redis.setex(`otp:${phone}`, this.ttlSeconds, JSON.stringify(payload));
      return { valid: false };
    }

    await this.redis.del(`otp:${phone}`);

    // Actualizar registro de auditoría más reciente
    await prisma.otpChallenge.updateMany({
      where: { phone, codeHash: payload.codeHash },
      data: { verifiedAt: new Date() },
    });

    return { valid: true, userId: payload.userId };
  }
}
