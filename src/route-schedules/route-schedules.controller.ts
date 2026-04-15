import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RouteSchedulesService } from './route-schedules.service';
import { CreateRouteScheduleDto } from './dto/create-route-schedule.dto';
import { UpdateRouteScheduleDto } from './dto/update-route-schedule.dto';
import { FilterRouteSchedulesDto } from './dto/filter-route-schedules.dto';
import { ApiTags } from '@nestjs/swagger/dist/decorators/api-use-tags.decorator';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class GenerateTripFromPlanDto {
  @ApiPropertyOptional({
    example: '2026-03-10T13:05:00Z',
    description:
      'Hora real de salida al botadero en ISO 8601. ' +
      'Si se omite, se calcula automáticamente como: endTime del día actual + estimatedDepartureOffsetMinutes del plan.',
  })
  @IsOptional()
  @IsDateString()
  departedAt?: string;
}

@ApiTags('Route Schedules')
@Controller('route-schedules')
export class RouteSchedulesController {
  constructor(
    private readonly routeSchedulesService: RouteSchedulesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una ruta programada',
    description:
      'Crea una ruta de recolección. Incluir `routeSegmentDetails.disposalTrip` ' +
      'para habilitar la generación automática de TruckTrip al finalizar la jornada (Etapa 1).',
  })
  create(@Body() dto: CreateRouteScheduleDto) {
    return this.routeSchedulesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar rutas con filtros opcionales' })
  findAll(@Query() query: FilterRouteSchedulesDto) {
    return this.routeSchedulesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una ruta por ID' })
  findOne(@Param('id') id: string) {
    return this.routeSchedulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una ruta (incluido el plan de viaje al botadero)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRouteScheduleDto,
  ) {
    return this.routeSchedulesService.update(id, dto);
  }

  /**
   * Endpoint clave para Etapa 1 — sin app del operador.
   *
   * El admin usa este endpoint desde el panel web al final de la jornada
   * para registrar el viaje al botadero. Los datos del camión y el botadero
   * ya están pre-configurados en `routeSegmentDetails.disposalTrip` de la ruta,
   * por lo que el admin solo confirma (o ajusta la hora de salida).
   */
  @Post(':id/generate-trip')
  @ApiOperation({
    summary: 'Generar TruckTrip desde el plan de la ruta (Etapa 1 — sin app del operador)',
    description:
      'Crea un viaje al botadero (TruckTrip) usando los datos pre-configurados en ' +
      '`routeSegmentDetails.disposalTrip`. Si no se envía `departedAt`, la hora se calcula ' +
      'automáticamente como endTime del día actual + estimatedDepartureOffsetMinutes. ' +
      'Lanza 409 si ya existe un viaje para ese camión hoy. ' +
      'Lanza 400 si la ruta no tiene `disposalTrip` configurado.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la ruta programada' })
  @ApiBody({ type: GenerateTripFromPlanDto, required: false })
  @ApiResponse({
    status: 201,
    description: 'TruckTrip creado exitosamente desde el plan de la ruta',
    schema: {
      example: {
        id: 'trip-uuid',
        truckId: 'truck-uuid',
        disposalSiteId: 'site-uuid',
        municipalityId: 'muni-uuid',
        departedAt: '2026-03-10T13:00:00.000Z',
        arrivedAt: null,
        unloadedAt: null,
        returnedAt: null,
        totalWeight: null,
        isArchived: false,
        createdAt: '2026-03-10T13:00:01.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'La ruta no tiene disposalTrip configurado o el camión no tiene municipalityId',
    schema: { example: { statusCode: 400, message: 'Esta ruta no tiene un plan de viaje al botadero configurado.' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Ruta o camión no encontrado',
    schema: { example: { statusCode: 404, message: 'Ruta no encontrada' } },
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un viaje al botadero para este camión hoy',
    schema: {
      example: {
        statusCode: 409,
        message: 'Ya existe un viaje al botadero para este camión hoy (ID: trip-uuid). Si necesitas registrar otro viaje, usa directamente POST /truck-trips.',
      },
    },
  })
  generateTrip(
    @Param('id') id: string,
    @Body() dto: GenerateTripFromPlanDto,
  ) {
    return this.routeSchedulesService.generateTripFromPlan(id, dto?.departedAt);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una ruta' })
  @ApiResponse({
    status: 200,
    description: 'Ruta eliminada exitosamente',
    schema: { example: { statusCode: 200, message: 'Ruta eliminada exitosamente' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Ruta no encontrada',
    schema: { example: { statusCode: 404, message: 'Ruta no encontrada', error: 'Not Found' } },
  })
  remove(@Param('id') id: string) {
    return this.routeSchedulesService.remove(id);
  }
}
