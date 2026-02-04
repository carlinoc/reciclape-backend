import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { FilterZonesDto } from './dto/filter-zones.dto';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

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
