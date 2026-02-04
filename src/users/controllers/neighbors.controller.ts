import { Controller, Post, Get, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { NeighborsService } from '../services/neighbors.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateNeighborDto } from '../dto/neighbors/create-neighbor.dto';
import { UpdateNeighborDto } from '../dto/neighbors/update-neighbor.dto';
import { FilterNeighborsDto } from '../dto/neighbors/filter-neighbors.dto';
import { UpdateFcmTokenDto } from '../dto/neighbors/update-fcm-token.dto';

@ApiTags('Neighbors')
@Controller('neighbors')
export class NeighborsController {
  constructor(private service: NeighborsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un vecino' })
  create(@Body() dto: CreateNeighborDto) {
    return this.service.create(dto);
  }

  @Patch('fcm-token/:id')
  @ApiOperation({ summary: 'Actualizar el FCM Token de un vecino' })
  updateFcmToken(@Param('id') id: string, @Body() dto: UpdateFcmTokenDto) {
    return this.service.updateFcmToken(id, dto.fcmToken);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vecinos con filtros dinámicos (zona, distrito, municipio, estado activo, estado archivado)' })
  findAll(@Query() filters: FilterNeighborsDto) {
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vecino' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un vecino' })
  update(@Param('id') id: string, @Body() dto: UpdateNeighborDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un vecino' })
  @ApiResponse({
    status: 200,
    description: 'Vecino archivado exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Vecino archivado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Vecino no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Vecino no encontrado',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  } 

  @Get(':id/points-history')
  @ApiOperation({ summary: 'Obtener el historial de puntos de un vecino' })
  getHistory(@Param('id') id: string) {
    return this.service.getPointsHistory(id);
  }
}
