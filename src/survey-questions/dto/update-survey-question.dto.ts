import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSurveyQuestionDto } from './create-survey-question.dto';

export class UpdateSurveyQuestionDto extends PartialType(
  OmitType(CreateSurveyQuestionDto, ['surveyId'] as const),
) {}
