import {
    BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyQuestion } from './entities/survey-question.entity';
import { Survey } from '../surveys/entities/survey.entity';
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto';
import { UpdateSurveyQuestionDto } from './dto/update-survey-question.dto';
import { FilterSurveyQuestionsDto } from './dto/filter-survey-questions.dto';
import { SurveyStatus } from 'src/surveys/enums/survey-status.enum';

@Injectable()
export class SurveyQuestionsService {
  constructor(
    @InjectRepository(SurveyQuestion)
    private readonly questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
  ) {}

  async create(dto: CreateSurveyQuestionDto): Promise<SurveyQuestion> {
    // Verificar que existe una encuesta con ese ID
    const survey = await this.surveyRepo.findOne({ where: { id: dto.surveyId } });
    if (!survey) throw new NotFoundException('Encuesta no encontrada');
    
    // Verificar que no exista una preguna con el mismo texto en la encuesta
    const existingQuestion = await this.questionRepo.findOne({
      where: { surveyId: dto.surveyId, questionText: dto.questionText },
    });
    if (existingQuestion) throw new ConflictException('Ya existe una pregunta con ese texto en la encuesta');


    // Verificar que no existe una pregunta con ese orden en la encuesta
    const exists = await this.questionRepo.findOne({
      where: {
        surveyId: dto.surveyId,
        questionOrder: dto.questionOrder,
      },
    });
    if (exists) {
      throw new ConflictException(
        'Ya existe una pregunta con ese orden en la encuesta',
      );
    }

    const question = this.questionRepo.create(dto);
    return this.questionRepo.save(question);
  }

  async findBySurvey(surveyId: string) {
    if(!surveyId) throw new BadRequestException('El parámetro surveyId es requerido');

    const queryBuilder = this.questionRepo
      .createQueryBuilder('question')
      .where('question.surveyId = :surveyId', { surveyId });

    // Ordenar por questionOrder ascending
    queryBuilder.orderBy('question.questionOrder', 'ASC');

    return await queryBuilder.getMany();
  }

  async findAll(
    filters: FilterSurveyQuestionsDto,
  ): Promise<SurveyQuestion[]> {
    return this.questionRepo.find({
      where: { ...filters },
      order: { questionOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SurveyQuestion> {
    const question = await this.questionRepo.findOne({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    return question;
  }

  async update(
    id: string,
    dto: UpdateSurveyQuestionDto,
  ): Promise<SurveyQuestion> {
    const question = await this.findOne(id);

    if (dto.questionOrder && dto.questionOrder !== question.questionOrder) {
      const exists = await this.questionRepo.findOne({
        where: {
          surveyId: question.surveyId,
          questionOrder: dto.questionOrder,
        },
      });

      if (exists) {
        throw new ConflictException(
          'Ya existe una pregunta con ese orden',
        );
      }
    }

    Object.assign(question, dto);
    return this.questionRepo.save(question);
  }

  async remove(id: string) {
    // Verificar que el status del survey sea DRAFT   
    const question = await this.findOne(id);
    const survey = await this.surveyRepo.findOne({ where: { id: question.surveyId } });
    if (!survey) throw new NotFoundException('Encuesta no encontrada');
    if (survey.status !== SurveyStatus.DRAFT) throw new BadRequestException('La pregunta solo puede eliminarse si la encuesta está en estado DRAFT');
    
    await this.questionRepo.remove(question);
    return { statusCode: 200, message: 'Pregunta eliminada exitosamente' };
  }
}
