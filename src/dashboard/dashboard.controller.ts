import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':municipalityId')
  @ApiOperation({
    summary: 'Dashboard principal del panel admin',
    description:
      'Resumen ejecutivo de todos los módulos: vecinos, flota, recolecciones, ' +
      'puntos, reclamos y canjes. Sin mapa. Una sola llamada.',
  })
  @ApiParam({ name: 'municipalityId', description: 'UUID de la municipalidad' })
  getAdminDashboard(@Param('municipalityId', ParseUUIDPipe) municipalityId: string) {
    return this.dashboardService.getAdminDashboard(municipalityId);
  }
}
