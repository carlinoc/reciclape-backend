import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RecyclingTypeService } from './recycling-type.service';
import { CreateRecyclingTypeDto } from './dto/create-recycling-type.dto';
import { UpdateRecyclingTypeDto } from './dto/update-recycling-type.dto';
import { FilterRecyclingTypesDto } from './dto/filter-recycling-types.dto';

@ApiTags('Recycling Types')
@Controller('recycling-types')
export class RecyclingTypeController {
  constructor(private readonly service: RecyclingTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Crear tipo de reciclaje de una municipalidad' })
  create(@Body() dto: CreateRecyclingTypeDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de reciclaje de una municipalidad' })
  findAll(@Query() filters: FilterRecyclingTypesDto) {
    // Si viene municipalityId, filtra por municipio
    if (filters.municipalityId) {
      return this.service.findByMunicipality(
        filters.municipalityId,
        filters.isActive,
        filters.isArchived,
        filters.isGarbage,
      );
    }
    
    // Si no viene municipalityId, lista todas
    return this.service.findAll(filters.isActive, filters.isArchived);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tipo de reciclaje de una municipalidad' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tipo de reciclaje de una municipalidad' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecyclingTypeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tipo de reciclaje de una municipalidad' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de reciclaje archivado exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Tipo de reciclaje archivado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de reciclaje no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Tipo de reciclaje no encontrado',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

}
