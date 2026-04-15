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
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CollectionAreaTypesService } from './collection-area-types.service';
import { CreateCollectionAreaTypeDto } from './dto/create-collection-area-type.dto';
import { UpdateCollectionAreaTypeDto } from './dto/update-collection-area-type.dto';
import { Filter } from 'firebase-admin/firestore';
import { FilterCollectionAreaTypeDto } from './dto/filter-collection-area-type.dto';

@ApiTags('Collection Area Types')
@Controller('collection-area-types')
export class CollectionAreaTypesController {
    constructor(private readonly collectionAreaTypesService: CollectionAreaTypesService) {}

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo tipo de área de recolección' })
    create(@Body() createCollectionAreaTypeDto: CreateCollectionAreaTypeDto) {
        return this.collectionAreaTypesService.create(createCollectionAreaTypeDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos los tipos de áreas de recolección' })
    findAll(@Query() filters: FilterCollectionAreaTypeDto) {
        return this.collectionAreaTypesService.findAll(filters.isArchived);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un tipo de área de recolección por ID' })
    @ApiParam({ name: 'id', type: 'string' })
    findOne(@Param('id') id: string) {
        return this.collectionAreaTypesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un tipo de área de recolección' })
    @ApiParam({ name: 'id', type: 'string' })
    update(@Param('id') id: string, @Body() updateCollectionAreaTypeDto: UpdateCollectionAreaTypeDto) {
        return this.collectionAreaTypesService.update(id, updateCollectionAreaTypeDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un tipo de área de recolección' })
    @ApiParam({ name: 'id', type: 'string' })
    remove(@Param('id') id: string) {
        return this.collectionAreaTypesService.remove(id);
    }
}
