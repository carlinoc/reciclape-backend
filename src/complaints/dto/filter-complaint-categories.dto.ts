import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FilterComplaintCategoriesDto {
  @ApiPropertyOptional({ description: 'Filtrar por municipalidad' })
  @IsUUID()
  @IsOptional()
  municipalityId?: string;

  @ApiPropertyOptional({ description: 'Filtrar solo activas (true/false)' })
  @Transform(({ value }) => {
    if (value === 'true')  return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
