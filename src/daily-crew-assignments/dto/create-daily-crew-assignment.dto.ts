import { IsUUID, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonnelRole } from 'src/users/enums/personnel-role.enum';
import { Shift } from '../entities/daily-crew-assignment.entity';

export class CreateDailyCrewAssignmentDto {
  @ApiProperty({ example: '2026-03-12', description: 'Fecha de la asignación (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: Shift, example: Shift.MORNING, description: 'Turno: MORNING (mañana), AFTERNOON (tarde), NIGHT (noche)' })
  @IsEnum(Shift)
  shift: Shift;

  @ApiProperty({ example: 'uuid-truck' })
  @IsUUID()
  truckId: string;

  @ApiProperty({ example: 'uuid-user' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: PersonnelRole, example: PersonnelRole.DRIVER })
  @IsEnum(PersonnelRole)
  personnelRole: PersonnelRole;

  @ApiPropertyOptional({ example: 'Cubre descanso del titular' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;
}
