import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsUUID, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateTruckPositionDto {
  @ApiProperty( { example: 'uuid-truck-id' })
  @IsUUID()
  truckId: string;

  @ApiProperty({ example: -71.53745 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: -16.40904 })
  @IsNumber()
  latitude: number;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @IsOptional()
  speed?: number;

  @ApiProperty( { example: 20 })
  @IsNumber()
  @IsOptional()
  @Min(0) @Max(360)
  heading?: number;

  @ApiProperty( { example: 30 })
  @IsNumber()
  @IsOptional()
  accuracy?: number;
  @ApiPropertyOptional({
    example: '2026-03-16T05:30:00Z',
    description: 'Timestamp ISO 8601 del dispositivo GPS. Si se omite, el servidor usa la hora de recepción.',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
