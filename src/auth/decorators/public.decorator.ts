import { SetMetadata } from '@nestjs/common';

/**
 * Marca un endpoint como público: el guard global de JWT no lo verificará.
 * Usar solo en:
 *   - Endpoints de login (auth/*)
 *   - POST /truck-positions  (viene del dispositivo GPS, sin usuario)
 *   - GET /ubigeo/*          (departamentos, provincias, distritos — datos públicos)
 *
 * @example
 *   @Public()
 *   @Post('login')
 *   login(@Body() dto: LoginDto) { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
