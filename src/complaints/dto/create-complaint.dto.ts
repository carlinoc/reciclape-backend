import { IsUUID, IsDateString, IsString, IsOptional, IsArray, IsBoolean, IsLatitude, IsLongitude, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComplaintDto {
  @ApiProperty({ description: 'ID del vecino que realiza el reclamo' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'ID de la municipalidad' })
  @IsUUID()
  municipalityId: string;

  @ApiProperty({ description: 'ID de la categoría del reclamo' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Dirección textual del lugar del incidente. Ej: "Calle Los Pinos 123, Carigrand"', example: 'Calle Los Pinos 123' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'ID de la zona del incidente' })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiProperty({ description: 'Fecha del incidente (YYYY-MM-DD)', example: '2026-03-10' })
  @IsDateString()
  incidentDate: string;

  @ApiProperty({ description: 'Descripción detallada del reclamo' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'URLs de fotos de evidencia', type: [String] })
  @IsArray()
  @IsOptional()
  evidencePhotos?: string[];

  @ApiPropertyOptional({ description: 'ID del camión detectado relacionado al incidente' })
  @IsUUID()
  @IsOptional()
  detectedTruckId?: string;

  @ApiPropertyOptional({ description: 'Indica si la posición fue verificada con GPS', default: false })
  @IsBoolean()
  @IsOptional()
  isPositionVerified?: boolean;
  @ApiPropertyOptional({ description: 'Latitud GPS del lugar del incidente', example: -13.5380 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitud GPS del lugar del incidente', example: -71.9157 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
