import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { SurveyStatus } from '../enums/survey-status.enum';

export class CreateSurveyDto {
  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;

  @ApiProperty({ example: 'Encuesta 1' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Descripción de la encuesta',
    description: 'Descripción de la encuesta (opcional).',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 10,
    description: 'Puntos de recompensa (opcional).',
    required: false,
    type: Number,
  })
  @IsInt()
  @Min(0)
  rewardPoints: number;

  @ApiProperty({ example: 5, description: 'Número total de preguntas.' })
  @IsInt()
  @Min(1)
  totalQuestions: number;

  @ApiProperty({
    example: true,
    description: 'Estado de la encuesta (true/false). Opcional.',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: '2026-01-01',
    description: 'Fecha de inicio de la encuesta (opcional).',
    required: false,
    type: String,
  })
  @IsOptional()
  startDate?: string;

  @ApiProperty({  
    example: '2026-01-31',
    description: 'Fecha de finalización de la encuesta (opcional).',
    required: false,
    type: String,
  })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 'DRAFT' })
  @IsString()
  @IsEnum(SurveyStatus)
  status: string;
}
