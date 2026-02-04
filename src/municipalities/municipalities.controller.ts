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
import { MunicipalitiesService } from './municipalities.service';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FilterMunicipalitiesDto } from './dto/filter-municipalities.dto';

/**
 * Controlador de municipios.
 * Gestiona las operaciones CRUD (crear, leer, actualizar, eliminar) de municipios.
 */
@ApiTags('Municipalities')
@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly service: MunicipalitiesService) {}

  /**
   * Crea un nuevo municipio.
   * @param dto - Datos del municipio a crear
   * @returns Municipio creado
   */
  @Post()
  @ApiOperation({ summary: 'Crear un municipio' })
  create(@Body() dto: CreateMunicipalityDto) {
    return this.service.create(dto);
  }

  /**
   * Obtiene municipalidades con filtros opcionales.
   * - Sin parámetros: lista todas
   * - Con provinceId: filtra por provincia
   * - Con isActive: filtra por estado
   */
  @Get()
  @ApiOperation({ summary: 'Listar municipalidades con filtros, opcionales' })
  findAll(@Query() filters: FilterMunicipalitiesDto) {
    // Si viene provinceId, filtra por provincia
    if (filters.provinceId) {
      return this.service.findByProvince(filters.provinceId, filters.isActive, filters.isArchived);
    }
    
    // Si no viene provinceId, lista todas
    return this.service.findAll(filters.isActive);
  }

  /**
   * Obtiene un municipio por su ID.
   * @param id - ID del municipio
   * @returns Datos del municipio
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un municipio' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Actualiza un municipio existente.
   * @param id - ID del municipio a actualizar
   * @param dto - Datos a actualizar
   * @returns Municipio actualizado
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un municipio' })
  update(@Param('id') id: string, @Body() dto: UpdateMunicipalityDto) {
    return this.service.update(id, dto);
  }

  /**
   * Elimina un municipio.
   * @param id - ID del municipio a eliminar
   * @returns Confirmación de eliminación
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un municipio' })
  @ApiResponse({
    status: 200,
    description: 'Municipio archivado exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Municipio archivado exitosamente' 
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Municipio no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Municipio no encontrado',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
