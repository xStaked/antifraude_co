import { Injectable, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class UserJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      throw err || new ForbiddenException('Acceso no autorizado');
    }
    if (user.type !== 'user') {
      throw new ForbiddenException('Se requiere sesión de usuario');
    }
    return user;
  }
}
