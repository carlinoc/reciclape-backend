import {
  Controller, Get, Post, Body, Query, Param, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { TruckPositionsService } from './truck-positions.service';
import { CreateTruckPositionDto } from './dto/create-truck-position.dto';
import { FilterTruckPositionsDto } from './dto/filter-truck-positions.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Truck Positions')
@Controller('truck-positions')
export class TruckPositionsController {
  constructor(private readonly service: TruckPositionsService) {}

  // ── CREATE ─────────────────────────────────────────────────────────────────
  @Public()
  @Post()
  @ApiOperation({ summary: 'Recibir posición GPS del camión (sin auth). Acepta timestamp del dispositivo.' })
  create(@Body() dto: CreateTruckPositionDto) {
    return this.service.create(dto);
  }

  // ── MAPA EN VIVO ──────────────────────────────────────────────────────────
  @Get('latest')
  @ApiOperation({ summary: 'Última posición de TODOS los camiones activos (mapa en vivo). Caché 10s.' })
  latest() {
    return this.service.getLatestPositions();
  }

  // ── HISTORIAL CON FILTROS ─────────────────────────────────────────────────
  @Get('history')
  @ApiOperation({
    summary: 'Historial de recorrido con filtros de fecha',
    description:
      'Devuelve posiciones con timestamp, lat, lng, speed, heading.\n' +
      'Usar preset: today | yesterday | week | last7days | month | last30days\n' +
      'O usar from/to con ISO 8601. Máx 2000 puntos por llamada.',
  })
  history(@Query() filters: FilterTruckPositionsDto) {
    return this.service.getHistory(filters);
  }

  // Alias para compatibilidad con frontend
  @Get('route')
  @ApiOperation({ summary: 'Alias de /history' })
  route(@Query() filters: FilterTruckPositionsDto) {
    return this.service.getHistory(filters);
  }

  // ── ÚLTIMAS N DEL DÍA ─────────────────────────────────────────────────────
  @Get(':truckId/last/today')
  @ApiOperation({ summary: 'Últimas N posiciones del día actual para un camión' })
  @ApiParam({ name: 'truckId', description: 'UUID del camión' })
  @ApiQuery({ name: 'limit', required: false, example: 50, description: 'Cantidad de posiciones (default: 50)' })
  lastToday(
    @Param('truckId', ParseUUIDPipe) truckId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.service.getLastNToday(truckId, Math.min(limit, 500));
  }

  // ── ÚLTIMAS N DE LA SEMANA ────────────────────────────────────────────────
  @Get(':truckId/last/week')
  @ApiOperation({ summary: 'Últimas N posiciones de los últimos 7 días para un camión' })
  @ApiParam({ name: 'truckId', description: 'UUID del camión' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  lastWeek(
    @Param('truckId', ParseUUIDPipe) truckId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.service.getLastNWeek(truckId, Math.min(limit, 500));
  }

  // ── ÚLTIMAS N DEL MES ─────────────────────────────────────────────────────
  @Get(':truckId/last/month')
  @ApiOperation({ summary: 'Últimas N posiciones de los últimos 30 días para un camión' })
  @ApiParam({ name: 'truckId', description: 'UUID del camión' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  lastMonth(
    @Param('truckId', ParseUUIDPipe) truckId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.service.getLastNMonth(truckId, Math.min(limit, 500));
  }
}
