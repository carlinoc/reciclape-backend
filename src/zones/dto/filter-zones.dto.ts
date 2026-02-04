import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para filtrar zonas.
 * Permite filtrar por municipalityId e isActive.
 */
export class FilterZonesDto {
  @ApiProperty({
    description: 'Filtrar por municipalityId'
  })
  @IsOptional()
  @IsString()
  municipalityId?: string;
  
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
}
