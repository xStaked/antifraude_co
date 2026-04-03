import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpRequest } from '../http/http-request';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<HttpRequest>();
    const now = Date.now();
    const method = req.method;
    const path = req.originalUrl || req.url;
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = (typeof forwardedFor === 'string' ? forwardedFor : undefined) || req.ip || 'unknown';
    const rawUserAgent = req.headers['user-agent'];
    const userAgent = typeof rawUserAgent === 'string' ? rawUserAgent : 'unknown';

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
