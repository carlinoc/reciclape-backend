import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DailyCrewAssignmentsService } from './daily-crew-assignments.service';
import { CreateDailyCrewAssignmentDto } from './dto/create-daily-crew-assignment.dto';
import { UpdateDailyCrewAssignmentDto } from './dto/update-daily-crew-assignment.dto';
import { FilterDailyCrewAssignmentsDto } from './dto/filter-daily-crew-assignments.dto';
import { Shift } from './entities/daily-crew-assignment.entity';

@ApiTags('Daily Crew Assignments')
@Controller('daily-crew-assignments')
export class DailyCrewAssignmentsController {
  constructor(private service: DailyCrewAssignmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear asignación diaria de tripulación',
    description:
      '**Campo `shift` requerido:** `MORNING` (Mañana) | `AFTERNOON` (Tarde) | `NIGHT` (Noche)\n\n' +
      '**Reglas:**\n' +
      '- DRIVER Lun–Sáb: solo el conductor titular. Domingos/Feriados: cualquier conductor.\n' +
      '- ASSISTANT: máx. 3 por turno por camión.\n' +
      '- PROMOTER / MANAGER: máx. 1 por turno por camión.\n' +
      '- Un operador no puede repetirse en el mismo turno-día.',
  })
  create(@Body() dto: CreateDailyCrewAssignmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar asignaciones con filtros de rango y turno',
    description:
      '`mode=day` → solo la fecha exacta.\n\n' +
      '`mode=week` → semana completa agrupada por fecha → turno.\n\n' +
      '`mode=month` → mes completo agrupado por fecha → turno.\n\n' +
      'Añadir `shift=MORNING|AFTERNOON|NIGHT` para filtrar por turno específico.',
  })
  findAll(@Query() filter: FilterDailyCrewAssignmentsDto) {
    return this.service.findAll(filter);
  }

  @Get('suggest')
  @ApiOperation({
    summary: 'Sugerir equipo para un camión, fecha y turno',
    description: 'Devuelve los titulares del camión disponibles para el turno indicado.',
  })
  suggest(
    @Query('truckId') truckId: string,
    @Query('date')    date:    string,
    @Query('shift')   shift:   Shift,
  ) {
    return this.service.suggest(truckId, date, shift);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asignación por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar notas de una asignación' })
  update(@Param('id') id: string, @Body() dto: UpdateDailyCrewAssignmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Eliminar asignación' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
