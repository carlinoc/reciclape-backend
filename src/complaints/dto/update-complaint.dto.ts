import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ComplaintStatus {
  OPEN        = 'OPEN',
  IN_REVIEW   = 'IN_REVIEW',
  RESOLVED    = 'RESOLVED',
  REJECTED    = 'REJECTED',
}

export class UpdateComplaintDto {
  @ApiPropertyOptional({ enum: ComplaintStatus, description: 'Nuevo estado del reclamo' })
  @IsEnum(ComplaintStatus)
  @IsOptional()
  status?: ComplaintStatus;

  @ApiPropertyOptional({ description: 'ID del admin asignado a resolver el reclamo' })
  @IsUUID()
  @IsOptional()
  assignedAdminId?: string;

  @ApiPropertyOptional({ description: 'Notas de resolución' })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Si la posición fue verificada con GPS' })
  @IsBoolean()
  @IsOptional()
  isPositionVerified?: boolean;
}
