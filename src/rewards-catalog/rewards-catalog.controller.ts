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
import { RewardsCatalogService } from './rewards-catalog.service';
import { CreateRewardCatalogDto } from './dto/create-reward-catalog.dto';
import { UpdateRewardCatalogDto } from './dto/update-reward-catalog.dto';
import { FilterRewardCatalogsDto } from './dto/filter-reward-catalogs.dto';

@ApiTags('Rewards Catalog')
@Controller('rewards-catalog')
export class RewardsCatalogController {
  constructor(private readonly service: RewardsCatalogService) {}

  @Post()
  @ApiOperation({ summary: 'Crear recompensa' })
  create(@Body() dto: CreateRewardCatalogDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar recompensas de una Municipalidad' })
  findAll(@Query() filters: FilterRewardCatalogsDto) {
    // Si viene municipalityId, filtra por municipio
    if (filters.municipalityId) {
      return this.service.findByMunicipality(filters.municipalityId, filters.isActive, filters.isArchived);
    }
    // Si no viene municipalityId, lista todas
    return this.service.findAll(filters.isActive, filters.isArchived);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una recompensa' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar recompensa' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRewardCatalogDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar recompensa' })
  @ApiResponse({
      status: 200,
      description: 'Recompensa archivada exitosamente',
      schema: {
        example: {
          statusCode: 200,
          message: 'Recompensa archivada exitosamente',
        },
      },
    })
    @ApiResponse({
      status: 404,
      description: 'Recompensa no encontrada',
      schema: {
        example: {
          statusCode: 404,
          message: 'Recompensa no encontrada',
          error: 'Not Found',
        },
      },
    })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
