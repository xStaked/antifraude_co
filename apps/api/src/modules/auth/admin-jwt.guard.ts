import { Injectable, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      throw err || new ForbiddenException('Acceso no autorizado');
    }
    if (user.type !== 'admin') {
      throw new ForbiddenException('Se requieren privilegios de administrador');
    }
    return user;
  }
}
