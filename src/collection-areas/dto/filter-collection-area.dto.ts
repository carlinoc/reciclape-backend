import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterCollectionAreaDto {
  @ApiPropertyOptional({ description: 'Filtrar por ruta programada (routeScheduleId)' })
  @IsOptional()
  @IsUUID()
  routeScheduleId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de área (areaTypeId)' })
  @IsOptional()
  @IsUUID()
  areaTypeId?: string;
}
