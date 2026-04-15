import { Controller, Post, Get, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { NeighborsService } from '../services/neighbors.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateNeighborDto } from '../dto/neighbors/create-neighbor.dto';
import { UpdateNeighborDto } from '../dto/neighbors/update-neighbor.dto';
import { FilterNeighborsDto } from '../dto/neighbors/filter-neighbors.dto';
import { UpdateFcmTokenDto } from '../dto/neighbors/update-fcm-token.dto';
import { UpdateNotificationSettingsDto } from '../dto/neighbors/update-notification-settings.dto';
import { SearchNeighborDto } from '../dto/neighbors/search-neighbor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

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

  @Get('search')
  @ApiOperation({
    summary: 'Buscar vecino por DNI o apellido dentro de una municipalidad',
    description:
      'Si `q` contiene solo dígitos se busca por DNI exacto. ' +
      'Si contiene letras se busca por apellido (insensible a mayúsculas y tildes). ' +
      'Retorna máximo 20 resultados.',
  })
  search(@Query() dto: SearchNeighborDto) {
    return this.service.searchByDniOrLastName(dto.municipalityId, dto.q);
  }

  @Get()
  findAll(@Query() filters: FilterNeighborsDto) {
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vecino por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/notification-settings')
  @ApiOperation({
    summary: 'Actualizar configuración de notificaciones del vecino',
    description: 'Endpoint específico para la app móvil. Actualiza notifyBefore y/o activateNotification en la tabla addresses. Solo enviar los campos que se quieren cambiar.',
  })
  updateNotificationSettings(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.service.updateNotificationSettings(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un vecino' })
  update(@Param('id') id: string, @Body() dto: UpdateNeighborDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archivar un vecino (soft delete)' })
  @ApiResponse({ status: 200, schema: { example: { statusCode: 200, message: 'Vecino archivado exitosamente' } } })
  @ApiResponse({ status: 404, schema: { example: { statusCode: 404, message: 'Vecino no encontrado', error: 'Not Found' } } })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/points-history')
  @ApiOperation({ summary: 'Historial de puntos de un vecino (paginado). Params: page, limit' })
  getHistory(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.service.getPointsHistory(id, pagination);
  }

  @Get(':id/points-balance')
  @ApiOperation({ summary: 'Balance actual de puntos del vecino' })
  getPointsBalance(@Param('id') id: string) {
    return this.service.getPointsBalance(id);
  }

  @Get(':id/last-collection')
  @ApiOperation({ summary: 'Última entrega de basura del vecino con detalle de items' })
  getLastCollection(@Param('id') id: string) {
    return this.service.getLastCollection(id);
  }

  @Get(':id/dashboard')
  @ApiOperation({
    summary: 'Dashboard del vecino — balance, última entrega y últimas 5 transacciones en una sola llamada',
    description: 'Endpoint optimizado para la pantalla principal de la app móvil. Devuelve balance de puntos, última entrega de basura, las últimas 5 transacciones y configuración de notificaciones.',
  })
  getDashboard(@Param('id') id: string) {
    return this.service.getDashboard(id);
  }
}
