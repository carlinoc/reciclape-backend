import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UsePipes, ValidationPipe, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { ApiTags, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FilterTrucksDto } from './dto/filter-trucks.dto';
import { FilterTruckMunicipalityDto } from './dto/filter-truck-municipality.dto';

@ApiTags('Trucks')
@Controller('trucks')
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los camiones de una zona' })
  findAll(@Query() filters: FilterTrucksDto) {
    const { isActive, isArchived, truckTypeId, page, limit } = filters;
    return this.trucksService.findAll(isActive, isArchived, page, limit);
  }

  @Get('zone/:zoneId')
  @ApiOperation({ summary: 'Listar camiones de una zona (via routeSchedules)' })
  findByZone(@Param('zoneId') zoneId: string, @Query() filters: FilterTrucksDto) {
    const { isActive, isArchived, truckTypeId, page, limit } = filters;
    return this.trucksService.findByZone(zoneId, truckTypeId, isActive, isArchived, page, limit);
  }

  @Get('municipality/:municipalityId')
  @ApiOperation({ summary: 'Listar todos los camiones de una municipalidad' })
  findByMunicipality(@Param('municipalityId') municipalityId: string, @Query() filters: FilterTrucksDto) {
    const { isActive, isArchived, page, limit } = filters;
    return this.trucksService.findByMunicipality(municipalityId, isActive, isArchived, page, limit);
  }
  
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ 
    version: '4',
    exceptionFactory: (errors) => {
      return new BadRequestException('El formato del ID del camión es inválido (se requiere UUID v4)');
    }
  })) id: string) {
    return this.trucksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un camión' })
  create(@Body() dto: CreateTruckDto) {
    return this.trucksService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un camión' })
  update(@Param('id') id: string, @Body() dto: UpdateTruckDto) {
    return this.trucksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un camión' })
  @ApiResponse({
    status: 200,
    description: 'Camión archivado exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Camión archivado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Camión no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Camión no encontrado',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.trucksService.remove(id);
  }
}