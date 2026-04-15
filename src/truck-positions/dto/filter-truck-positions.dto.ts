import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class FilterTruckPositionsDto {
  @ApiPropertyOptional({
    description: 'ID del camión (requerido para historial de recorrido)',
    example: 'uuid-del-camion',
  })
  @IsOptional()
  @IsUUID()
  truckId?: string;

  @ApiPropertyOptional({
    description: 'Fecha inicio en ISO 8601. Ej: 2026-03-09T00:00:00Z',
    example: '2026-03-09T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Fecha fin en ISO 8601. Ej: 2026-03-09T23:59:59Z',
    example: '2026-03-09T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description:
      'Atajo de rango: "today" | "yesterday" | "week" | "last7days". ' +
      'Si se usan "from"/"to" al mismo tiempo, estos tienen prioridad.',
    example: 'today',
    enum: ['today', 'yesterday', 'week', 'last7days', 'month', 'last30days'],
  })
  @IsOptional()
  preset?: 'today' | 'yesterday' | 'week' | 'last7days' | 'month' | 'last30days';

  @ApiPropertyOptional({
    description: 'Máximo de posiciones a retornar (1–2000). Default: 500',
    example: 500,
    default: 500,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(2000)
  limit?: number = 500;
}
