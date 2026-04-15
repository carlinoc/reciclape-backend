import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateTruckTripDto {
  @ApiPropertyOptional({ example: '2025-06-10T06:45:00Z', description: 'Registrar llegada al botadero' })
  @IsOptional()
  @IsDateString()
  arrivedAt?: string;

  @ApiPropertyOptional({ example: '2025-06-10T07:15:00Z', description: 'Registrar fin de descarga' })
  @IsOptional()
  @IsDateString()
  unloadedAt?: string;

  @ApiPropertyOptional({ example: '2025-06-10T08:30:00Z', description: 'Registrar retorno a base' })
  @IsOptional()
  @IsDateString()
  returnedAt?: string;

  @ApiPropertyOptional({ example: 4500.50, description: 'Peso total descargado en kg' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalWeight?: number;
}
