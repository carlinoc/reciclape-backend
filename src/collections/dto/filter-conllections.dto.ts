import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterCollectionsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por municipalityId' })
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

  @ApiPropertyOptional({ description: 'Filtrar por zoneId' })
  @IsOptional()
  @IsUUID()
  zoneId?: string;
}