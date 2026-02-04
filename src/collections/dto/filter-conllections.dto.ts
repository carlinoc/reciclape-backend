import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsBoolean, IsString, IsUUID } from 'class-validator';

export class FilterCollectionsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por municipalityId'
  })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;
  
  @ApiPropertyOptional({ description: 'Filtrar por userId' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por operatorUserId' })
  @IsOptional()
  @IsUUID()
  operatorUserId?: string;
  
  @ApiPropertyOptional({ description: 'Filtrar por truckId' })
  @IsOptional()
  @IsUUID()
  truckId?: string;
}