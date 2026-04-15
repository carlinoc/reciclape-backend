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
import { FilterCollectionAreaDto } from './dto/filter-collection-area.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Collection Areas')
@Controller('collection-areas')
export class CollectionAreasController {
  constructor(
    private readonly collectionAreasService: CollectionAreasService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un área de recolección vinculada a una ruta' })
  create(@Body() dto: CreateCollectionAreaDto) {
    return this.collectionAreasService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar áreas de recolección. Filtrar por routeScheduleId y/o areaTypeId' })
  findAll(@Query() filters: FilterCollectionAreaDto) {
    return this.collectionAreasService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un área de recolección por ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id') id: string) {
    return this.collectionAreasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un área de recolección' })
  update(@Param('id') id: string, @Body() dto: UpdateCollectionAreaDto) {
    return this.collectionAreasService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un área de recolección' })
  @ApiResponse({
    status: 200,
    description: 'Área de recolección eliminada',
    schema: { example: { statusCode: 200, message: 'Área de recolección eliminada' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Área de recolección no encontrada',
    schema: { example: { statusCode: 404, message: 'Área de recolección no encontrada', error: 'Not Found' } },
  })
  remove(@Param('id') id: string) {
    return this.collectionAreasService.remove(id);
  }
}
