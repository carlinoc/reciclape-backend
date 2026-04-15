import { IsString, IsUUID, IsOptional, IsBoolean, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateZoneDto {
  @ApiProperty({ example: 'Zona 1' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;

  @ApiProperty({
    example: '#FF0000',
    description: 'Color de la zona (opcional).',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Estado de la zona (true/false). Opcional.',
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
  @ApiProperty({
    example: -13.5380,
    description: 'Latitud del centroide de la zona (para auto-detectar zona del vecino)',
    required: false,
  })
  @IsOptional()
  @IsLatitude()
  centerLatitude?: number;

  @ApiProperty({
    example: -71.9157,
    description: 'Longitud del centroide de la zona',
    required: false,
  })
  @IsOptional()
  @IsLongitude()
  centerLongitude?: number;
}
