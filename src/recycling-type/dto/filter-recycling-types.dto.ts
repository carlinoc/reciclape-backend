import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FilterRecyclingTypesDto {
  @ApiProperty({
    description: 'Filtrar por municipalityId'
  })
  @IsUUID()
  municipalityId: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activa (opcional)',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    })
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

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de reciclaje(es basura en general), opcional',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isGarbage?: boolean;
}
