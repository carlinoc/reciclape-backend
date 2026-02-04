import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FilterDevicesDto } from './dto/filter.devices.dto';

/**
 * Controlador de dispositivos.
 * Gestiona las operaciones CRUD (crear, leer, actualizar, eliminar) de dispositivos.
 */
@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Crea un nuevo dispositivo.
   * @param dto - Datos del dispositivo a crear
   * @returns Dispositivo creado
   */
  @Post()
  @ApiOperation({ summary: 'Crear un dispositivo' })
  create(@Body() dto: CreateDeviceDto) {
    return this.devicesService.create(dto);
  }

  /**
   * Obtiene un dispositivo por su ID.
   * @param id - ID del dispositivo
   * @returns Datos del dispositivo
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un dispositivo' })
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  /**
   * Actualiza un dispositivo existente.
   * @param id - ID del dispositivo a actualizar
   * @param dto - Datos a actualizar
   * @returns Dispositivo actualizado
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un dispositivo' })
  update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.devicesService.update(id, dto);
  }

  /**
   * Elimina un dispositivo.
   * @param id - ID del dispositivo a eliminar
   * @returns Mensaje de confirmación
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un dispositivo' })
  @ApiResponse({
    status: 200,
    description: 'Dispositivo archivado exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Dispositivo archivado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Dispositivo no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Dispositivo no encontrado',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }

  /**
   * Obtiene dispositivos. Si se pasa municipalityId, filtra por ese municipio.
   * @param filters - Filtros opcionales para la consulta (municipalityId, isActive, isArchived)
   * @returns Lista de dispositivos
   */
  @Get()
  @ApiOperation({ summary: 'Listar todos los dispositivos de una Municipalidad' })
  findAll(@Query() filters: FilterDevicesDto) {
    // Si viene municipalityId, filtra por municipio
    if (filters.municipalityId) {
      return this.devicesService.findByMunicipality(filters.municipalityId, filters.isActive, filters.isArchived);
    }
    // Si no viene municipalityId, lista todas
    return this.devicesService.findAll(filters.isActive, filters.isArchived);
  }
}
