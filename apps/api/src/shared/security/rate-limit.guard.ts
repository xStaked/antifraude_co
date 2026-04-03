import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

export interface RateLimitConfig {
  keyPrefix: string;
  points: number;
  duration: number; // seconds
  keyExtractor: (req: any) => string;
  blockDuration?: number;
}

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly redis: Redis;
  private readonly limiters = new Map<string, RateLimiterRedis>();

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    const redisUrl = this.configService.get<string>('redisUrl') ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!config) {
      return true;
    }

    const nodeEnv = this.configService.get<string>('nodeEnv') ?? 'development';
    if (nodeEnv === 'development') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = config.keyExtractor(request);

    let limiter = this.limiters.get(config.keyPrefix);
    if (!limiter) {
      limiter = new RateLimiterRedis({
        storeClient: this.redis,
        keyPrefix: config.keyPrefix,
        points: config.points,
        duration: config.duration,
        blockDuration: config.blockDuration,
      });
      this.limiters.set(config.keyPrefix, limiter);
    }

    try {
      await limiter.consume(key);
      return true;
    } catch {
      throw new HttpException('Demasiadas solicitudes. Intenta más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
