import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}