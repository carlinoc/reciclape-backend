import { Controller, Post, Body, HttpCode, HttpStatus, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginNeighborDto } from './dto/login-neighbor.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginOperatorDto } from './dto/login-operator.dto';

@ApiTags('Auth - Users')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('neighbors/login')
  @ApiOperation({ summary: 'Login de vecino (App móvil)' })
  loginNeighbor(@Body() dto: LoginNeighborDto) {
    return this.authService.loginNeighbor(dto.email, dto.password, dto.fcmToken);
  }

  @Post('neighbors/logout/:id')
  @ApiOperation({ summary: 'Cerrar sesión de vecino (App móvil)' })
  logout(@Param('id') id: string) {
    return this.authService.logout(id);
  }
  
  @Post('admins/login')
  @ApiOperation({ summary: 'Login administrador (Admin Web)' })
  loginAdmin(@Body() dto: LoginAdminDto) {
    return this.authService.loginAdmin(dto.email, dto.password);
  }

  @Post('operators/login')
  @ApiOperation({ summary: 'Login operador (Admin Web)' })
  loginOperator(@Body() dto: LoginOperatorDto) {
    return this.authService.loginOperator(dto.email, dto.password);
  }
}
