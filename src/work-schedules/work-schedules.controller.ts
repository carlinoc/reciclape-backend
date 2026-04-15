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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WorkSchedulesService } from './work-schedules.service';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { FilterWorkSchedulesDto } from './dto/filter-work-schedules.dto';

@ApiTags('Work Schedules')
@Controller('work-schedules')
export class WorkSchedulesController {
  constructor(private readonly service: WorkSchedulesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar estado de un operario para un día (WORKING, REST, RETEN)' })
  create(@Body() dto: CreateWorkScheduleDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros de horario con filtros opcionales' })
  findAll(@Query() filter: FilterWorkSchedulesDto) {
    return this.service.findAll(filter);
  }

  @Get('retenes/available')
  @ApiOperation({ summary: 'Listar retenes disponibles para una fecha y municipalidad' })
  @ApiQuery({ name: 'date', example: '2025-06-09' })
  @ApiQuery({ name: 'municipalityId', example: 'uuid-municipality' })
  findAvailableRetenes(
    @Query('date') date: string,
    @Query('municipalityId') municipalityId: string,
  ) {
    return this.service.findAvailableRetenes(date, municipalityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un registro de horario por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un registro de horario' })
  update(@Param('id') id: string, @Body() dto: UpdateWorkScheduleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archivar un registro de horario' })
  @ApiResponse({ status: 200, schema: { example: { statusCode: 200, message: 'Registro archivado exitosamente' } } })
  @ApiResponse({ status: 404, schema: { example: { statusCode: 404, message: 'Registro de horario no encontrado' } } })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
