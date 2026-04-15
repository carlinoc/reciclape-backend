import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FleetService } from './fleet.service';

@ApiTags('Fleet')
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get('dashboard/:municipalityId')
  @ApiOperation({
    summary: 'Dashboard de flota en tiempo real',
    description:
      'Devuelve TODAS las unidades de la municipalidad con su posición GPS actual, ' +
      'estado operativo (MOVING/STOPPED/OFFLINE/NO_GPS), operador asignado y zonas. ' +
      'Solo considera el día actual. Diseñado para el mapa en vivo del panel web.',
  })
  @ApiParam({ name: 'municipalityId', description: 'UUID de la municipalidad' })
  dashboard(@Param('municipalityId', ParseUUIDPipe) municipalityId: string) {
    return this.fleetService.getDashboard(municipalityId);
  }
}
