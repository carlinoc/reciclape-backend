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
import { CollectionAreasService } from './collection-areas.service';
import { CreateCollectionAreaDto } from './dto/create-collection-area.dto';
import { UpdateCollectionAreaDto } from './dto/update-collection-area.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilterCollectionAreaDto } from './dto/filter-collection-area.dto';

@ApiTags('Collection Areas')
@Controller('collection-areas')
export class CollectionAreasController {
  constructor(
    private readonly collectionAreasService: CollectionAreasService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un área de recolección' })
  create(@Body() dto: CreateCollectionAreaDto) {
    return this.collectionAreasService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las áreas de recolección de una zona' })
  findAll(@Query() filters: FilterCollectionAreaDto) {
    if (filters.zoneId) {
      return this.collectionAreasService.findByZoneId(filters.zoneId, filters.areaTypeId);
    }

    return this.collectionAreasService.findAll(filters.areaTypeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una área de recolección' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id') id: string) {
    return this.collectionAreasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una área de recolección' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCollectionAreaDto,
  ) {
    return this.collectionAreasService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una área de recolección' })
  @ApiResponse({
        status: 200,
        description: 'Aréa de recolección eliminada',
        schema: {
        example: {
            statusCode: 200,
            message: 'Aréa de recolección eliminada',
        },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Área de recolección no encontrada',
        schema: {
        example: {
            statusCode: 404,
            message: 'Área de recolección no encontrada',
            error: 'Not Found',
        },
        },
    })
  remove(@Param('id') id: string) {
    return this.collectionAreasService.remove(id);
  }
}
