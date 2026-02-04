import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  Max,
  IsMilitaryTime,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRouteScheduleDto {
  @ApiProperty({ example: 'uuid-truck' })
  @IsUUID()
  truckId: string;

  @ApiProperty({ example: 'uuid-zone' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ example: 'uuid-collection-area', description: 'ID del área de recolección (opcional)' })
  @IsOptional()
  @IsUUID()
  collectionAreaId?: string;

  @ApiProperty({ example: 1, description: 'Día de la semana (1-7)' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ example: true, description: 'Indica si es la ruta principal (opcional)' })
  @IsOptional()
  @IsBoolean()
  isMainRoad?: boolean;

  @ApiProperty({ example: '05:00', description: 'Hora de inicio (formato HH:MM)' })
  @IsMilitaryTime()
  startTime: string;

  @ApiProperty({ example: '08:00', description: 'Hora de fin (formato HH:MM)' })
  @IsMilitaryTime()
  endTime: string;

  //Detalles de la ruta en formato JSON ejemplo:  El camión debe empezar en Lat/Lon X, ir por la Calle Z, girar a la derecha en la Av. Y, y terminar en Lat/Lon W.
  @ApiProperty({
    example: { A: { lat: -12.0833, lon: -77.0167 }, B: { lat: -12.0833, lon: -77.0167 }, C: { lat: -12.0833, lon: -77.0167 } },
    description: 'Detalles de la ruta (opcional)' 
  })
  @IsOptional()
  routeSegmentDetails?: any;
}