import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateRecyclingTypeDto {
  @ApiProperty({ example: 'Plástico' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Reciclaje de botellas y envases plásticos' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  pointsGiven: number;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;

  @ApiProperty({ example: 'KILOS' })
  @IsString()
  unitType: string; //ENUM: KILOS, LITERS, METERS

  @ApiProperty({ example: false })
  @IsBoolean()
  isGarbage: boolean;

  @ApiPropertyOptional({ example: true, description: 'Estado activo del tipo de reciclaje', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Estado archivado', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isArchived?: boolean;
}