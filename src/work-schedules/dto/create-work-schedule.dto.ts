import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { WorkStatus } from '../enums/work-status.enum';
import { RestReason } from '../enums/rest-reason.enum';

export class CreateWorkScheduleDto {
  @ApiProperty({ example: 'uuid-user', description: 'ID del operario' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: '2025-06-09', description: 'Fecha del registro (YYYY-MM-DD)' })
  @IsDateString()
  workDate: string;

  @ApiProperty({ enum: WorkStatus, example: WorkStatus.REST, description: 'Estado del operario ese día' })
  @IsEnum(WorkStatus)
  status: WorkStatus;

  @ApiProperty({
    enum: RestReason,
    example: RestReason.SUNDAY_COMPENSATION,
    description: 'Motivo del descanso o activación como retén (opcional)',
    required: false,
  })
  @IsOptional()
  @IsEnum(RestReason)
  reason?: RestReason;

  @ApiProperty({
    example: '2025-06-08',
    description: 'Fecha trabajada que origina este descanso compensatorio (ej: el domingo que trabajó)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  compensatoryForDate?: string;

  @ApiProperty({ example: 'uuid-user', description: 'ID del operario que reemplaza (retén)', required: false })
  @IsOptional()
  @IsUUID()
  replacedByUserId?: string;

  @ApiProperty({ example: 'Cubriendo a García por descanso dominical', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;
}
