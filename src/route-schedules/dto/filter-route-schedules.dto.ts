import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class FilterRouteSchedulesDto {
  @ApiProperty({
    description: 'Filtrar por area de recolección',
  })
  @IsOptional()
  @IsString()
  collectionAreaId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por zona',
  })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por camión',
  })
  @IsOptional()
  @IsString() 
  truckId?: string;
}
