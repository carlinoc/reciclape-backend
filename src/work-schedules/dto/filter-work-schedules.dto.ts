import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { WorkStatus } from '../enums/work-status.enum';

export class FilterWorkSchedulesDto {
  @ApiPropertyOptional({ description: 'Filtrar por operario' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: '2025-06-09', description: 'Filtrar por fecha exacta' })
  @IsOptional()
  @IsDateString()
  workDate?: string;

  @ApiPropertyOptional({ example: '2025-06-01', description: 'Filtrar desde esta fecha' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2025-06-30', description: 'Filtrar hasta esta fecha' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: WorkStatus, description: 'Filtrar por estado (WORKING, REST, RETEN)' })
  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;

  @ApiPropertyOptional({ description: 'Filtrar por municipalidad' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;
}
