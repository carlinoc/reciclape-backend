import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { RouteShift, RouteTurnNumber, ROUTE_SHIFT_LABELS, ROUTE_TURN_LABELS } from '../enums/route-schedule.enums';

export class FilterRouteSchedulesDto {
  @ApiPropertyOptional({ description: 'Filtrar por municipalidad' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por zona' })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por camión' })
  @IsOptional()
  @IsString()
  truckId?: string;

  @ApiPropertyOptional({ description: 'Filtrar rutas que cubran este día (1=Lun … 7=Dom)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @ApiPropertyOptional({ enum: RouteShift, description: 'Filtrar por turno del día (MORNING, AFTERNOON, NIGHT)' })
  @IsOptional()
  @IsEnum(RouteShift)
  shift?: RouteShift;

  @ApiPropertyOptional({ enum: RouteTurnNumber, description: 'Filtrar por número de turno (FIRST, SECOND)' })
  @IsOptional()
  @IsEnum(RouteTurnNumber)
  turnNumber?: RouteTurnNumber;

  @ApiPropertyOptional({ description: 'Filtrar solo vías principales' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isMainRoad?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar por estado activo/inactivo' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
