import { IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FilterRewardCatalogsDto {
  @ApiPropertyOptional({
    description: 'ID del municipio',
    example: '3f2c9d54-2d9b-4f7c-9d99-123456789abc',
  })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar solo recompensas activas',
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
