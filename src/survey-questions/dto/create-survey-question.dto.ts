import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSurveyQuestionDto {
  @ApiProperty({ example: 'uuid-survey' })
  @IsUUID()
  surveyId: string;

  @ApiProperty({ example: 'Pregunta 1' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ example: 'SINGLE_CHOICE' })
  @IsString()
  questionType: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  questionOrder: number;

  @ApiProperty({
    example: '[{ value: "1", label: "Opción 1" }, { value: "2", label: "Opción 2" }]',
    description: 'Opciones de la pregunta (opcional).',
    required: false,
    type: String,
  })
  @IsOptional()
  optionsRawData?: any;
}
