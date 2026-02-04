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
import { SurveyQuestionsService } from './survey-questions.service';
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto';
import { UpdateSurveyQuestionDto } from './dto/update-survey-question.dto';
import { FilterSurveyQuestionsDto } from './dto/filter-survey-questions.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Survey Questions')
@Controller('survey-questions')
export class SurveyQuestionsController {
  constructor(
    private readonly surveyQuestionsService: SurveyQuestionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una pregunta' })
  create(@Body() dto: CreateSurveyQuestionDto) {
    return this.surveyQuestionsService.create(dto);
  }
  
  @Get()
  @ApiOperation({ summary: 'Listar todas las preguntas de una encuesta' })
  findAll(@Query() filters: FilterSurveyQuestionsDto) {
    if(filters.surveyId){
      return this.surveyQuestionsService.findBySurvey(filters.surveyId);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una pregunta' })
  findOne(@Param('id') id: string) {
    return this.surveyQuestionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una pregunta' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSurveyQuestionDto,
  ) {
    return this.surveyQuestionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una pregunta' })
  @ApiResponse({
    status: 200,
    description: 'Pregunta eliminada exitosamente',
    schema: {
    example: {
        statusCode: 200,
        message: 'Pregunta eliminada exitosamente',
    },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Pregunta no encontrada',
    schema: {
    example: {
        statusCode: 404,
        message: 'Pregunta no encontrada',
        error: 'Not Found',
    },
    },
  })
  remove(@Param('id') id: string) {
    return this.surveyQuestionsService.remove(id);
  }
}
