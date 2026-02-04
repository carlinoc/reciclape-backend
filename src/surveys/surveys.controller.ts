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
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { FilterSurveysDto } from './dto/filter-surveys.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una encuesta' })
  create(@Body() dto: CreateSurveyDto) {
    return this.surveysService.create(dto);
  }

  
  @Get()
  @ApiOperation({ summary: 'Listar todas las encuestas de una Municipalidad' })
  findAll(@Query() filters: FilterSurveysDto) {
    if(filters.municipalityId){
      return this.surveysService.findByMunicipality(filters.municipalityId, filters.isActive, filters.isArchived);
    }
    
    return this.surveysService.findAll(filters.isActive, filters.isArchived);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una encuesta' })
  findOne(@Param('id') id: string) {
    return this.surveysService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una encuesta' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSurveyDto,
  ) {
    return this.surveysService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una encuesta' })
  @ApiResponse({
    status: 200,
    description: 'Encuesta archivada exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Encuesta archivada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Encuesta no encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Encuesta no encontrada',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.surveysService.remove(id);
  }
}
