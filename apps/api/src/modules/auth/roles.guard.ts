import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.type) {
      throw new ForbiddenException('Acceso no autorizado');
    }
    const userRole = user.type === 'admin' ? user.role : 'user';
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
