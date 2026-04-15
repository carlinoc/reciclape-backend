import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ConvoyRole } from '../enums/convoy-role.enum';

export class FilterTruckConvoysDto {
  @ApiPropertyOptional({ example: '2025-06-10', description: 'Filtrar por fecha operativa' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Filtrar por camión principal' })
  @IsOptional()
  @IsUUID()
  mainTruckId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por camión de apoyo' })
  @IsOptional()
  @IsUUID()
  supportTruckId?: string;

  @ApiPropertyOptional({ enum: ConvoyRole, description: 'Filtrar por rol del convoy' })
  @IsOptional()
  @IsEnum(ConvoyRole)
  role?: ConvoyRole;

  @ApiPropertyOptional({ description: 'Filtrar por municipalidad' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;
}
