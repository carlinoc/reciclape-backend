import { IsString, IsOptional, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Samsung', description: 'Marca' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: 'Galaxy S10', description: 'Modelo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ example: 'SM-G973F', description: 'Serie' })
  @IsOptional()
  @IsString()
  serie?: string;

  @ApiProperty({ example: 'Activo', description: 'Estado' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: '2022-01-01', description: 'Fecha de caducidad de la garantía' })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;

  @ApiProperty({ example: 'uuid-municipality', description: 'ID del municipio' })
  @IsUUID()
  municipalityId: string;

  @ApiProperty({
    description: 'Estado del dispositivo (true/false). Opcional.',
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
