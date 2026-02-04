import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsBoolean, IsString, IsUUID } from 'class-validator';

export class FilterNeighborsDto {

  @ApiPropertyOptional({
    description: 'Filtrar por municipalityId'
  })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por zonaId, opcional',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por districtId, opcional',
    type: String,
  })
  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por estado archivado, opcional',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isArchived?: boolean;
}
