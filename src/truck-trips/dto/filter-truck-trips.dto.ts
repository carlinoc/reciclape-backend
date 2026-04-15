import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class FilterTruckTripsDto {
  @ApiPropertyOptional({ description: 'Filtrar por camión' })
  @IsOptional()
  @IsUUID()
  truckId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por sitio de disposición' })
  @IsOptional()
  @IsUUID()
  disposalSiteId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por municipalidad' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @ApiPropertyOptional({ example: '2025-06-01', description: 'Filtrar viajes desde esta fecha (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2025-06-30', description: 'Filtrar viajes hasta esta fecha (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
