import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FilterSurveyQuestionsDto {

  @ApiProperty({
    description: 'Filtrar por encuesta',
  })
  @IsUUID()
  surveyId: string;
}