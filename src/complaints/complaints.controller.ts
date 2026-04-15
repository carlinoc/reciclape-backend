import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { FilterComplaintsDto } from './dto/filter-complaints.dto';
import { FilterComplaintCategoriesDto } from './dto/filter-complaint-categories.dto';
import { CreateComplaintCategoryDto } from './dto/create-complaint-category.dto';
import { PartialType } from '@nestjs/swagger';

@ApiTags('Complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  // ── COMPLAINTS ────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Crear un reclamo' })
  create(@Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar reclamos con filtros opcionales y paginación' })
  findAll(@Query() filters: FilterComplaintsDto) {
    return this.complaintsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un reclamo por ID' })
  @ApiParam({ name: 'id', description: 'UUID del reclamo' })
  findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar estado o asignación de un reclamo' })
  @ApiParam({ name: 'id', description: 'UUID del reclamo' })
  update(@Param('id') id: string, @Body() dto: UpdateComplaintDto) {
    return this.complaintsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un reclamo' })
  @ApiParam({ name: 'id', description: 'UUID del reclamo' })
  remove(@Param('id') id: string) {
    return this.complaintsService.remove(id);
  }

  // ── CATEGORIES ────────────────────────────────────────────────────────────

  @Post('categories')
  @ApiOperation({ summary: 'Crear una categoría de reclamo' })
  createCategory(@Body() dto: CreateComplaintCategoryDto) {
    return this.complaintsService.createCategory(dto);
  }

  @Get('categories/list')
  @ApiOperation({ summary: 'Listar categorías de reclamos' })
  findAllCategories(@Query() filters: FilterComplaintCategoriesDto) {
    return this.complaintsService.findAllCategories(filters);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la categoría' })
  findOneCategory(@Param('id') id: string) {
    return this.complaintsService.findOneCategory(id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Actualizar una categoría de reclamo' })
  @ApiParam({ name: 'id', description: 'UUID de la categoría' })
  updateCategory(@Param('id') id: string, @Body() dto: CreateComplaintCategoryDto) {
    return this.complaintsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Eliminar una categoría de reclamo' })
  @ApiParam({ name: 'id', description: 'UUID de la categoría' })
  removeCategory(@Param('id') id: string) {
    return this.complaintsService.removeCategory(id);
  }
}
