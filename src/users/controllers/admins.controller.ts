import { Controller, Post, Get, Body, Query, Param, Patch, Delete } from '@nestjs/common';
import { AdminsService } from '../services/admins.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAdminDto } from '../dto/admins/create-admin.dto';
import { FilterAdminsDto } from '../dto/admins/filter-admins.dto';
import { UpdateAdminDto } from '../dto/admins/update-admin.dto';

@ApiTags('Admins')
@Controller('admins')
export class AdminsController {
  constructor(private service: AdminsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un administrador' })
  create(@Body() dto: CreateAdminDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar administradores con filtros dinámicos (zona, distrito, municipio, estado activo, estado archivado)' })
  findAll(@Query() filters: FilterAdminsDto) {
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un administrador' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un administrador' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un administrador' })
  @ApiResponse({
    status: 200,
    description: 'Administrador archivado exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Administrador archivado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Administrador no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Administrador no encontrado',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
