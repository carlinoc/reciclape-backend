import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';
import { AdminRole } from '../../users/enums/admin-role.enum';

/**
 * Guard de roles para admins. Se usa SIEMPRE después del JwtAuthGuard global
 * (que ya validó el JWT), así que req.user siempre existe aquí.
 *
 * Si el endpoint NO tiene @AdminRoles() este guard deja pasar a cualquier admin.
 * Si SÍ tiene @AdminRoles(...) solo pasan los admins con ese rol.
 */
@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin @AdminRoles() → no se aplica restricción de subrole
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user?.adminRole || !requiredRoles.includes(user.adminRole)) {
      throw new ForbiddenException(
        `Acceso restringido. Se requiere rol: ${requiredRoles.join(' o ')}.`,
      );
    }

    return true;
  }
}
