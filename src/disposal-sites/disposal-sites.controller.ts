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
import { DisposalSitesService } from './disposal-sites.service';
import { CreateDisposalSiteDto } from './dto/create-disposal-site.dto';
import { UpdateDisposalSiteDto } from './dto/update-disposal-site.dto';
import { FilterDisposalSitesDto } from './dto/filter-disposal-sites.dto';

@ApiTags('Disposal Sites')
@Controller('disposal-sites')
export class DisposalSitesController {
  constructor(private readonly service: DisposalSitesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un sitio de disposición final (ej: Botadero Jara)' })
  create(@Body() dto: CreateDisposalSiteDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar sitios de disposición con filtros opcionales' })
  findAll(@Query() filter: FilterDisposalSitesDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un sitio de disposición por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un sitio de disposición' })
  update(@Param('id') id: string, @Body() dto: UpdateDisposalSiteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archivar un sitio de disposición' })
  @ApiResponse({ status: 200, schema: { example: { statusCode: 200, message: 'Sitio de disposición archivado exitosamente' } } })
  @ApiResponse({ status: 404, schema: { example: { statusCode: 404, message: 'Sitio de disposición no encontrado' } } })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
