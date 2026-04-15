import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TruckTripsService } from './truck-trips.service';
import { CreateTruckTripDto } from './dto/create-truck-trip.dto';
import { UpdateTruckTripDto } from './dto/update-truck-trip.dto';
import { FilterTruckTripsDto } from './dto/filter-truck-trips.dto';

@ApiTags('Truck Trips')
@Controller('truck-trips')
export class TruckTripsController {
  constructor(private readonly service: TruckTripsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar inicio de viaje al botadero' })
  create(@Body() dto: CreateTruckTripDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar viajes al botadero con filtros opcionales' })
  findAll(@Query() filter: FilterTruckTripsDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un viaje por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar viaje (registrar llegada, descarga o retorno)' })
  update(@Param('id') id: string, @Body() dto: UpdateTruckTripDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archivar un viaje' })
  @ApiResponse({ status: 200, schema: { example: { statusCode: 200, message: 'Viaje archivado exitosamente' } } })
  @ApiResponse({ status: 404, schema: { example: { statusCode: 404, message: 'Viaje al botadero no encontrado' } } })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
