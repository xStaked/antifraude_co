import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    const method = req.method;
    const path = req.originalUrl || req.url;
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return next.handle().pipe(
      tap(() => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const duration = Date.now() - now;
        const log = {
          timestamp: new Date().toISOString(),
          method,
          path,
          ip,
          userAgent,
          statusCode,
          durationMs: duration,
        };
        console.log(JSON.stringify(log));
      }),
    );
  }
}
