import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateCollectionAreaTypeDto {
  @ApiProperty({ example: 'APV', description: 'Tipo de área de recolección' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ example: 2, description: 'Número de visitas por semana por defecto', default: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  defaultVisitsPerWeek?: number;

  @ApiProperty({ example: false, description: 'Indica si requiere recolección diaria (vías principales)', default: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  requiresDailyCollection?: boolean;
}