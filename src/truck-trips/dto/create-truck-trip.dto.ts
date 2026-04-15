import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsDecimal, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateTruckTripDto {
  @ApiProperty({ example: 'uuid-truck' })
  @IsUUID()
  truckId: string;

  @ApiProperty({ example: 'uuid-disposal-site', description: 'ID del sitio de disposición (ej: Botadero Jara)' })
  @IsUUID()
  disposalSiteId: string;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;

  @ApiProperty({ example: '2025-06-10T05:30:00Z', description: 'Fecha y hora de partida hacia el botadero' })
  @IsDateString()
  departedAt: string;

  @ApiProperty({ example: '2025-06-10T06:45:00Z', description: 'Fecha y hora de llegada al botadero', required: false })
  @IsOptional()
  @IsDateString()
  arrivedAt?: string;

  @ApiProperty({ example: '2025-06-10T07:15:00Z', description: 'Fecha y hora en que termina la descarga', required: false })
  @IsOptional()
  @IsDateString()
  unloadedAt?: string;

  @ApiProperty({ example: '2025-06-10T08:30:00Z', description: 'Fecha y hora de retorno a base', required: false })
  @IsOptional()
  @IsDateString()
  returnedAt?: string;

  @ApiProperty({ example: 4500.50, description: 'Peso total descargado en kg', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalWeight?: number;
}
