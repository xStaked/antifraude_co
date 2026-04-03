import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { createHash } from 'crypto';

export interface RequestMetadata {
  ip: string;
  ipHash: string;
  userAgent?: string;
}

@Injectable()
export class RequestMetadataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const forwarded = request.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' && forwarded ? forwarded.split(',')[0]!.trim() : (request.ip || request.socket?.remoteAddress || 'unknown');
    const userAgent = request.headers['user-agent'] as string | undefined;

    request.metadata = {
      ip,
      ipHash: createHash('sha256').update(ip).digest('hex'),
      userAgent,
    } satisfies RequestMetadata;

    return next.handle();
  }
}
