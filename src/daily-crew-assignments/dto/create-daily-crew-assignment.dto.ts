import { IsUUID, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDailyCrewAssignmentDto {
  @ApiProperty({ example: '2025-01-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'uuid-truck' })
  @IsUUID()
  truckId: string;

  @ApiProperty({ example: 'uuid-user' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'DRIVER' })
  @IsString()
  personnelRole: string;
}
