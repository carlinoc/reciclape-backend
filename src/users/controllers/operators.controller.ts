import { Controller, Post, Get, Delete, Body, Param, Patch, Query } from '@nestjs/common';
import { OperatorsService } from '../services/operators.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateOperatorDto } from '../dto/operators/update-operator.dto';
import { FilterOperatorsDto } from '../dto/operators/filter-operators.dto';
import { CreateOperatorDto } from '../dto/operators/create-operator.dto';

@ApiTags('Operators')
@Controller('operators')
export class OperatorsController {
  constructor(private service: OperatorsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un operador' })
  create(@Body() dto: CreateOperatorDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un operador' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar operadores con filtros dinámicos (zona, distrito, municipio, estado activo, estado archivado)' })
  findAll(@Query() filters: FilterOperatorsDto) {
    return this.service.findAll(filters);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un operador' })
  update(@Param('id') id: string, @Body() dto: UpdateOperatorDto) {
    return this.service.update(id, dto);
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un operador' })
  @ApiResponse({
    status: 200,
    description: 'Operador archivado exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Operador archivado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Operador no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Operador no encontrado',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  } 
}
