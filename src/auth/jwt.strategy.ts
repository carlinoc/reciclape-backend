import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET no está definido en las variables de entorno');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      // Pasar el token raw al método validate para checar blacklist
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    // SEC-04: verificar que el token no esté en la blacklist de Redis.
    // La clave es jwt_blacklist:<jti> donde jti es el JWT ID único del token.
    if (payload.jti) {
      const isBlacklisted = await this.redis.get(`jwt_blacklist:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revocado. Inicia sesión nuevamente.');
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      adminRole: payload.adminRole ?? null, // SUPER_ADMIN | ADMIN | null
      jti: payload.jti,
    };
  }
}
