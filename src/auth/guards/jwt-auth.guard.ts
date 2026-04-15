import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard JWT global aplicado a TODOS los endpoints del sistema.
 *
 * Comportamiento:
 *  - Si el endpoint tiene @Public()         → deja pasar sin verificar token
 *  - Si no hay header Authorization         → HTTP 401
 *  - Si el token es inválido/expirado       → HTTP 401
 *  - Si el token está en la blacklist Redis → HTTP 401 (manejado en JwtStrategy)
 *  - En cualquier otro caso                 → deja pasar e inyecta req.user
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar si el endpoint o el controller tiene @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException(
        'Token de acceso requerido. Inicia sesión para continuar.'
      );
    }
    return user;
  }
}
