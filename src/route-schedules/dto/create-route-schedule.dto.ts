import {
  IsBoolean, IsDateString, IsInt, IsOptional, IsUUID, IsEnum,
  Min, Max, IsMilitaryTime, ValidateNested,
  IsString, IsNumber, IsArray, ArrayMinSize, ArrayMaxSize, IsLatitude, IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { RouteSegmentDetails } from '../interfaces/route-segment-details.interface';
import { RouteShift, RouteTurnNumber, ROUTE_SHIFT_LABELS, ROUTE_TURN_LABELS } from '../enums/route-schedule.enums';

// ── Waypoint ──────────────────────────────────────────────────────────────────

export class WaypointDto {
  @ApiProperty({ example: 1, description: 'Orden del punto dentro del segmento' })
  @IsInt()
  order: number;

  @ApiProperty({ example: -13.5300, description: 'Latitud decimal' })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -71.9610, description: 'Longitud decimal' })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: 'Esq. Jr. Las Flores', description: 'Etiqueta visible en el mapa' })
  @IsOptional()
  @IsString()
  label?: string;
}

// ── Segmento de recolección ───────────────────────────────────────────────────

export class RouteSegmentDto {
  @ApiProperty({ example: 1, description: 'Número de orden del tramo (1, 2, 3…)' })
  @IsInt()
  order: number;

  @ApiProperty({ example: 'Tramo 1 - APV Carigrand', description: 'Nombre descriptivo del tramo' })
  @IsString()
  areaName: string;

  @ApiPropertyOptional({ example: '05:45:00', description: 'Hora estimada de inicio de recojo en este tramo (HH:MM:SS)' })
  @IsOptional()
  @IsMilitaryTime()
  pickupTime?: string;

  @ApiPropertyOptional({ example: 5, description: 'Tiempo de espera en el tramo en minutos' })
  @IsOptional()
  @IsNumber()
  waitingMinutes?: number;

  @ApiPropertyOptional({ example: 45, description: 'Duración estimada del tramo en minutos (campo legado)' })
  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: 'Zona de alta densidad, reducir velocidad' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [WaypointDto],
    description: 'Waypoints GPS del tramo en orden. Mínimo 2 para dibujar polilínea.',
    example: [
      { order: 1, latitude: -13.5295, longitude: -71.9680, label: 'Inicio tramo 1' },
      { order: 2, latitude: -13.5310, longitude: -71.9655, label: 'Esq. Jr. Las Flores' },
      { order: 3, latitude: -13.5325, longitude: -71.9630, label: 'Fin tramo 1' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaypointDto)
  waypoints?: WaypointDto[];
}

// ── Tramo final (botadero) ────────────────────────────────────────────────────

export class RouteFinalDto {
  @ApiProperty({ example: -13.5380, description: 'Latitud del botadero' })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -71.9157, description: 'Longitud del botadero' })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: 'Botadero Jaquira' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 90, description: 'Tiempo de viaje al botadero en minutos' })
  @IsOptional()
  @IsNumber()
  travelMinutes?: number;

  @ApiPropertyOptional({ example: '12:50:00', description: 'Hora estimada de llegada al botadero (HH:MM:SS)' })
  @IsOptional()
  @IsMilitaryTime()
  arrivalTime?: string;

  @ApiPropertyOptional({ example: 20, description: 'Tiempo de espera en el botadero en minutos' })
  @IsOptional()
  @IsNumber()
  waitingMinutes?: number;

  @ApiPropertyOptional({ example: '14:30:00', description: 'Hora estimada de regreso a la base (HH:MM:SS)' })
  @IsOptional()
  @IsMilitaryTime()
  returnToBaseTime?: string;

  @ApiPropertyOptional({ example: 'uuid-disposal-site', description: 'UUID del sitio en disposalSites. Necesario para generate-trip.' })
  @IsOptional()
  @IsUUID()
  disposalSiteId?: string;

  @ApiPropertyOptional({ type: [WaypointDto], description: 'Waypoints del trayecto al botadero (opcional)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaypointDto)
  waypoints?: WaypointDto[];

  @ApiPropertyOptional({ example: 'Usar ruta alterna por obras en Av. Central' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ── Origen (base operativa) ───────────────────────────────────────────────────

export class RouteOriginDto {
  @ApiProperty({ example: -13.5380, description: 'Latitud de la base operativa' })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -71.9157, description: 'Longitud de la base operativa' })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: 'Base Operativa Municipal - San Sebastián' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: '05:30:00', description: 'Hora de salida de la base (HH:MM:SS)' })
  @IsOptional()
  @IsMilitaryTime()
  departureTime?: string;
}

// ── Contenedor principal ──────────────────────────────────────────────────────

export class RouteSegmentDetailsDto {
  @ApiPropertyOptional({
    type: () => RouteOriginDto,
    description: 'Base operativa: coordenadas y hora de salida.',
    example: { latitude: -13.5380, longitude: -71.9157, label: 'Base Operativa Municipal', departureTime: '05:30:00' },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RouteOriginDto)
  origin?: RouteOriginDto;

  @ApiPropertyOptional({
    type: [RouteSegmentDto],
    description: 'Tramos de recolección en orden con hora de recojo y tiempo de espera.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteSegmentDto)
  segments?: RouteSegmentDto[];

  @ApiPropertyOptional({
    type: () => RouteFinalDto,
    description: 'Tramo final al botadero: coordenadas, tiempos y horas estimadas.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RouteFinalDto)
  final?: RouteFinalDto;
}

// ── DTO principal ─────────────────────────────────────────────────────────────

export class CreateRouteScheduleDto {
  @ApiProperty({ example: 'uuid-truck' })
  @IsUUID()
  truckId: string;

  @ApiProperty({ example: 'uuid-zone' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({
    example: [1, 4],
    description: 'Días de la semana en que aplica la ruta. 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 7=Dom. Mínimo 1, máximo 3.',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  daysOfWeek: number[];

  @ApiProperty({
    enum: RouteShift,
    example: RouteShift.MORNING,
    description: 'Turno del día: MORNING (Mañana), AFTERNOON (Tarde), NIGHT (Noche)',
  })
  @IsEnum(RouteShift)
  shift: RouteShift;

  @ApiPropertyOptional({
    enum: RouteTurnNumber,
    example: RouteTurnNumber.FIRST,
    description: 'Número de turno: FIRST (Primer Turno) o SECOND (Segundo Turno). Default: FIRST',
  })
  @IsOptional()
  @IsEnum(RouteTurnNumber)
  turnNumber?: RouteTurnNumber;

  @ApiPropertyOptional({ example: false, description: 'Vía principal (recolección diaria)' })
  @IsOptional()
  @IsBoolean()
  isMainRoad?: boolean;

  @ApiProperty({ example: '07:00', description: 'Hora inicio turno (HH:MM)' })
  @IsMilitaryTime()
  startTime: string;

  @ApiProperty({ example: '13:00', description: 'Hora fin turno (HH:MM)' })
  @IsMilitaryTime()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Recorrido completo: base operativa → tramos de recolección con waypoints GPS → botadero.',
    type: () => RouteSegmentDetailsDto,
    example: {
      origin: {
        latitude: -13.5380,
        longitude: -71.9157,
        label: 'Base Operativa Municipal',
        departureTime: '05:30:00',
      },
      segments: [
        {
          order: 1,
          areaName: 'Tramo 1',
          pickupTime: '05:45:00',
          waitingMinutes: 5,
          waypoints: [
            { order: 1, latitude: -13.5430, longitude: -71.9181, label: '' },
          ],
        },
        {
          order: 2,
          areaName: 'Tramo 2',
          pickupTime: '06:10:00',
          waitingMinutes: 7,
          waypoints: [
            { order: 1, latitude: -13.5438, longitude: -71.9181, label: '' },
            { order: 2, latitude: -13.5445, longitude: -71.9177, label: '' },
          ],
        },
      ],
      final: {
        label: 'Botadero Jaquira',
        latitude: -13.5380,
        longitude: -71.9157,
        travelMinutes: 90,
        arrivalTime: '12:50:00',
        waitingMinutes: 20,
        returnToBaseTime: '14:30:00',
        disposalSiteId: 'uuid-botadero-jaquira',
      },
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RouteSegmentDetailsDto)
  routeSegmentDetails?: RouteSegmentDetailsDto;

  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
