import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDailyCrewAssignmentDto {
  @ApiPropertyOptional({ example: 'Nota actualizada' })
  @IsOptional()
  @IsString()
  notes?: string;
}
