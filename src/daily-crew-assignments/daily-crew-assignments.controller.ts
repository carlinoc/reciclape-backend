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
import { DailyCrewAssignmentsService } from './daily-crew-assignments.service';
import { CreateDailyCrewAssignmentDto } from './dto/create-daily-crew-assignment.dto';
import { UpdateDailyCrewAssignmentDto } from './dto/update-daily-crew-assignment.dto';
import { FilterDailyCrewAssignmentsDto } from './dto/filter-daily-crew-assignments.dto';

@ApiTags('Daily Crew Assignments')
@Controller('daily-crew-assignments')
export class DailyCrewAssignmentsController {
  constructor(private service: DailyCrewAssignmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear asignación diaria de tripulación' })
  create(@Body() dto: CreateDailyCrewAssignmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar asignaciones con filtros dinámicos ( date, personnelRole )' })
  findAll(@Query() filter: FilterDailyCrewAssignmentsDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asignación' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Actualizar asignación' })
  // update(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateDailyCrewAssignmentDto,
  // ) {
  //   return this.service.update(id, dto);
  // }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar asignación' })
  @ApiResponse({
    status: 200,
    description: 'Asignación eliminada exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Asignación eliminada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Asignación no encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Asignación no encontrada',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
