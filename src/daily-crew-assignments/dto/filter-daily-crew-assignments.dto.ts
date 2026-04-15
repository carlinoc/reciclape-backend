import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { PersonnelRole } from 'src/users/enums/personnel-role.enum';
import { Shift } from '../entities/daily-crew-assignment.entity';

export enum DateRangeMode {
  DAY   = 'day',
  WEEK  = 'week',
  MONTH = 'month',
}

export class FilterDailyCrewAssignmentsDto {
  @ApiPropertyOptional({ example: 'uuid-municipality' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @ApiPropertyOptional({ example: '2026-03-12', description: 'Fecha de referencia (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    enum: DateRangeMode,
    default: DateRangeMode.DAY,
    description: '"day" = solo ese día | "week" = semana completa | "month" = mes completo',
  })
  @IsOptional()
  @IsEnum(DateRangeMode)
  mode?: DateRangeMode = DateRangeMode.DAY;

  @ApiPropertyOptional({ enum: Shift, description: 'Filtrar por turno específico' })
  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift;

  @ApiPropertyOptional({ example: 'uuid-truck' })
  @IsOptional()
  @IsUUID()
  truckId?: string;

  @ApiPropertyOptional({ example: 'uuid-user' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: PersonnelRole })
  @IsOptional()
  @IsEnum(PersonnelRole)
  personnelRole?: PersonnelRole;
}
