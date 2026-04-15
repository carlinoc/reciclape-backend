import { Controller, Post, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginNeighborDto } from './dto/login-neighbor.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginOperatorDto } from './dto/login-operator.dto';
import { Public } from './decorators/public.decorator';
import { CreateNeighborDto } from '../users/dto/neighbors/create-neighbor.dto';

@ApiTags('Auth - Users')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('neighbors/register')
  @ApiOperation({
    summary: 'Registro de vecino (App móvil — público)',
    description: 'Crea la cuenta del vecino y devuelve el accessToken listo para usar. Igual que un login inmediato tras el registro.',
  })
  registerNeighbor(@Body() dto: CreateNeighborDto) {
    return this.authService.registerNeighbor(dto);
  }

  @Public()
  @Post('neighbors/login')
  @ApiOperation({ summary: 'Login de vecino (App móvil)' })
  loginNeighbor(@Body() dto: LoginNeighborDto) {
    return this.authService.loginNeighbor(dto.email, dto.password, dto.fcmToken);
  }

  /**
   * Logout real: invalida el token en Redis (blacklist).
   * Requiere JWT válido en el header Authorization para extraer el jti.
   * El guard global lo deja pasar porque @Public() no está — así obtenemos req.user.
   */
  @Post('neighbors/logout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cerrar sesión de vecino — invalida el token JWT (requiere Authorization header)',
  })
  logout(@Request() req: any) {
    const userId: string = req.user.userId;
    const jti: string | undefined = req.user.jti;
    return this.authService.logout(userId, jti);
  }

  @Public()
  @Post('admins/login')
  @ApiOperation({ summary: 'Login administrador (Panel Web)' })
  loginAdmin(@Body() dto: LoginAdminDto) {
    return this.authService.loginAdmin(dto.email, dto.password);
  }

  @Public()
  @Post('operators/login')
  @ApiOperation({ summary: 'Login operador (Panel Web)' })
  loginOperator(@Body() dto: LoginOperatorDto) {
    return this.authService.loginOperator(dto.email, dto.password);
  }
}
