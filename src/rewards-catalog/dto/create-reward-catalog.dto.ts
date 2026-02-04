import {
  IsUUID,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateRewardCatalogDto {
  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;

  @ApiProperty({ example: 'Recompensa 1' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Descripción de la recompensa' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Puntos de recompensa' })
  @IsOptional()
  @IsString()
  rewardType?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  pointsRequired: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Estado de la recompensa (true/false). Opcional.',
    required: false,
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
}
