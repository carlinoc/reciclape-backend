import { IsString, IsOptional, IsBoolean, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateMunicipalityDto {
  @ApiProperty({ example: 'San Sebastián', description: 'Nombre oficial' })
  @IsString()
  officialName: string;

  @ApiProperty({ example: '080501', description: 'ID del distrito' })
  @IsString()
  districtId: string;

  @ApiProperty({ example: 'Distrital', description: 'Tipo de municipio' })
  @IsOptional()
  @IsString()
  municipalityType?: string;

  @ApiProperty({ example: 'Av. de la República 123', description: 'Dirección' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '0845555555', description: 'Teléfono' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'www.san-sebastian.com', description: 'Página web' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: 'Juan Perez', description: 'Nombre del jefe' })
  @IsOptional()
  @IsString()
  mayorName?: string;

  @ApiProperty({ example: 'Lun-Vie 08:00 - 17:00', description: 'Horario de atención' })
  @IsOptional()
  @IsString()
  hoursOfOperation?: string;

  @ApiProperty({ example: 'Base Operativa Municipal - San Sebastián', description: 'Nombre de la base operativa' })
  @IsOptional()
  @IsString()
  operationalBaseName?: string;

  @ApiProperty({ example: -13.5150, description: 'Latitud de la base operativa' })
  @IsOptional()
  @IsLatitude()
  operationalBaseLatitude?: number;

  @ApiProperty({ example: -71.9800, description: 'Longitud de la base operativa' })
  @IsOptional()
  @IsLongitude()
  operationalBaseLongitude?: number;

  @ApiProperty({ example: 'Botadero Municipal de Jaquira', description: 'Nombre del botadero o relleno sanitario' })
  @IsOptional()
  @IsString()
  dumpName?: string;

  @ApiProperty({ example: -13.5514, description: 'Latitud del botadero' })
  @IsOptional()
  @IsLatitude()
  dumpLatitude?: number;

  @ApiProperty({ example: -72.0168, description: 'Longitud del botadero' })
  @IsOptional()
  @IsLongitude()
  dumpLongitude?: number;

  @ApiProperty({
      description: 'Filtro de estado activo (true/false). Opcional.',
      required: false,
      type: Boolean,
    })
    @IsOptional()
    // Usamos Transform para manejar la conversión de "true"/"false" (string de la URL) a boolean
    @Transform(({ value }) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    })
    @IsBoolean()
    isActive?: boolean;
}
