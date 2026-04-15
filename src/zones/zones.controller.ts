import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseFloatPipe } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { FilterZonesDto } from './dto/filter-zones.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Controlador de zonas.
 * Gestiona las operaciones CRUD (crear, leer, actualizar, eliminar) de zonas.
 */
@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  /**
   * Crea una nueva zona.
   * @param dto - Datos de la zona a crear
   * @returns Zona creada
   */
  @Post()
  @ApiOperation({ summary: 'Crear una zona' })
  create(@Body() dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  /**
   * Obtiene todas las zonas con filtros opcionales.
   * @param filters - Filtros opcionales (municipalityId, isActive, isArchived)
   * @returns Lista de zonas filtradas
   */
  @Get()
  @ApiOperation({ summary: 'Listar todas las zonas de una Municipalidad' })
  findAll(@Query() filters: FilterZonesDto) {
    // Si viene municipalityId, filtra por municipio
    if (filters.municipalityId) {
      return this.zonesService.findByMunicipality(filters.municipalityId, filters.isActive, filters.isArchived);
    }
    // Si no viene municipalityId, lista todas
    return this.zonesService.findAll(filters.isActive, filters.isArchived);
  }

  /**
   * Obtiene una zona por su ID.
   * @param id - ID de la zona
   * @returns Datos de la zona
   */
  @Public()
  @Get('detect-public')
  @ApiOperation({ summary: 'Detectar zona por coordenadas — PUBLICO (para registro de vecinos sin token)' })
  @ApiQuery({ name: 'latitude',       required: true, description: 'Latitud GPS' })
  @ApiQuery({ name: 'longitude',      required: true, description: 'Longitud GPS' })
  @ApiQuery({ name: 'municipalityId', required: true, description: 'UUID de la municipalidad' })
  detectZonePublic(
    @Query('latitude',  ParseFloatPipe) latitude:  number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('municipalityId') municipalityId: string,
  ) {
    return this.zonesService.detectZoneByCoords(latitude, longitude, municipalityId);
  }

  @Get('detect')
  @ApiOperation({
    summary: 'Detectar zona por latitud y longitud del vecino',
    description:
      'Devuelve la zona cuyo centroide es el más cercano al punto GPS indicado. ' +
      'Requiere que las zonas tengan centerLatitude y centerLongitude configurados.',
  })
  @ApiQuery({ name: 'latitude',       required: true, description: 'Latitud GPS del vecino. Ej: -13.5380' })
  @ApiQuery({ name: 'longitude',      required: true, description: 'Longitud GPS del vecino. Ej: -71.9157' })
  @ApiQuery({ name: 'municipalityId', required: true, description: 'UUID de la municipalidad' })
  detectZone(
    @Query('latitude',  ParseFloatPipe) latitude:  number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('municipalityId') municipalityId: string,
  ) {
    return this.zonesService.detectZoneByCoords(latitude, longitude, municipalityId);
  }

  @Get('with-schedules')
  @ApiOperation({
    summary: 'Zonas + rutas + areas en una sola llamada (optimizado para panel admin)',
    description:
      'Elimina el patron N+1: en vez de 1 llamada por zona para obtener sus rutas, ' +
      'devuelve todas las zonas con sus routeSchedules y collectionAreas anidadas. ' +
      'Usar en el componente padre y pasar como props a cada ZoneCard.',
  })
  @ApiQuery({ name: 'municipalityId', required: true, description: 'UUID de la municipalidad' })
  findWithSchedules(@Query('municipalityId') municipalityId: string) {
    return this.zonesService.findWithSchedules(municipalityId);
  }

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Listado simple de zonas — PUBLICO (para registro de vecinos sin token)' })
  @ApiQuery({ name: 'municipalityId', required: true })
  findPublic(@Query('municipalityId') municipalityId: string) {
    return this.zonesService.findSimpleByMunicipality(municipalityId);
  }

  @Get('simple')
  @ApiOperation({ summary: 'Listado simple de zonas: id, name, color, centerLatitude, centerLongitude. Default: isActive=true' })
  @ApiQuery({ name: 'municipalityId', required: true,  description: 'UUID de la municipalidad' })
  @ApiQuery({ name: 'isActive',       required: false, description: 'true = activas (default) | false = inactivas' })
  findSimple(
    @Query('municipalityId') municipalityId: string,
    @Query('isActive') isActive?: string,
  ) {
    const active = isActive === undefined ? undefined : isActive === 'true';
    return this.zonesService.findSimpleByMunicipality(municipalityId, active);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una zona' })
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }

  /**
   * Actualiza una zona existente.
   * @param id - ID de la zona a actualizar
   * @param dto - Datos a actualizar
   * @returns Zona actualizada
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una zona' })
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.zonesService.update(id, dto);
  }

  /**
   * Elimina una zona.
   * @param id - ID de la zona a eliminar
   * @returns Mensaje de confirmación
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una zona' })
  @ApiResponse({
    status: 200,
    description: 'Zona archivada exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Zona archivada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Zona no encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Zona no encontrada',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.zonesService.remove(id);
  }
}
