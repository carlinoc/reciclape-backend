import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateTruckTypeDto {
  @ApiProperty({ example: 'Compactador', description: 'Tipo de camión' })
  @IsString()
  @Length(1, 100)
  type: string;
}
