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
import { TruckConvoysService } from './truck-convoys.service';
import { CreateTruckConvoyDto } from './dto/create-truck-convoy.dto';
import { UpdateTruckConvoyDto } from './dto/update-truck-convoy.dto';
import { FilterTruckConvoysDto } from './dto/filter-truck-convoys.dto';

@ApiTags('Truck Convoys')
@Controller('truck-convoys')
export class TruckConvoysController {
  constructor(private readonly service: TruckConvoysService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un convoy (compactador + camión de apoyo)' })
  create(@Body() dto: CreateTruckConvoyDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar convoys con filtros opcionales' })
  findAll(@Query() filter: FilterTruckConvoysDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un convoy por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un convoy' })
  update(@Param('id') id: string, @Body() dto: UpdateTruckConvoyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archivar un convoy' })
  @ApiResponse({ status: 200, schema: { example: { statusCode: 200, message: 'Convoy archivado exitosamente' } } })
  @ApiResponse({ status: 404, schema: { example: { statusCode: 404, message: 'Convoy no encontrado' } } })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
