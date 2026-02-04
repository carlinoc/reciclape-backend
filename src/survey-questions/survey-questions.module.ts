import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyQuestionsService } from './survey-questions.service';
import { SurveyQuestionsController } from './survey-questions.controller';
import { SurveyQuestion } from './entities/survey-question.entity';
import { Survey } from '../surveys/entities/survey.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyQuestion, Survey])],
  controllers: [SurveyQuestionsController],
  providers: [SurveyQuestionsService],
  exports: [SurveyQuestionsService],
})
export class SurveyQuestionsModule {}
