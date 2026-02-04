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
import { TruckTypeService } from './truck-type.service';
import { CreateTruckTypeDto } from './dto/create-truck-type.dto';
import { UpdateTruckTypeDto } from './dto/update-truck-type.dto';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FilterTruckTypeDto } from './dto/filter-truck-type.dto';

/**
 * Controlador de tipos de camiones.
 * Gestiona las operaciones CRUD de tipos de camiones.
 */
@ApiTags('Truck Types')
@Controller('truck-type')
export class TruckTypeController {
  constructor(private readonly truckTypeService: TruckTypeService) {}

  /**
   * Crea un nuevo tipo de camión.
   * @param dto - Datos del tipo de camión a crear
   * @returns Tipo de camión creado
   */
  @Post()
  @ApiOperation({ summary: 'Crear un tipo de camión' })
  create(@Body() dto: CreateTruckTypeDto) {
    return this.truckTypeService.create(dto);
  }

  /**
   * Obtiene todos los tipos de camiones.
   * @returns Lista de todos los tipos de camiones
   */
  @Get()
  @ApiOperation({ summary: 'Listar todos los tipos de camión' })
  findAll(@Query() filters: FilterTruckTypeDto) {
    return this.truckTypeService.findAll(filters.isArchived);
  }

  /**
   * Obtiene un tipo de camión por su ID.
   * @param id - ID del tipo de camión
   * @returns Tipo de camión encontrado
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de camión' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id') id: string) {
    return this.truckTypeService.findOne(id);
  }

  /**
   * Actualiza un tipo de camión existente.
   * @param id - ID del tipo de camión a actualizar
   * @param dto - Datos a actualizar
   * @returns Tipo de camión actualizado
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un tipo de camión' })
  update(@Param('id') id: string, @Body() dto: UpdateTruckTypeDto) {
    return this.truckTypeService.update(id, dto);
  }

  /**
   * Elimina un tipo de camión.
   * @param id - ID del tipo de camión a eliminar
   * @returns Confirmación de eliminación
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un tipo de camión' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de camión archivado exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Tipo de camión archivado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de camión no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Tipo de camión no encontrado',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.truckTypeService.remove(id);
  }
}
