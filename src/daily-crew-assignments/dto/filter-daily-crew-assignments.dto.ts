import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';

export class FilterDailyCrewAssignmentsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por fecha de la asignación en formato AAAA-MM-DD',
    example: '2025-01-20',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por rol del personal',
    example: 'DRIVER',
  })
  @IsOptional()
  @IsString()
  @IsOptional()
  personnelRole?: string;
  
  @IsOptional()
  @IsUUID()
  truckId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
