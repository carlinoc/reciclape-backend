import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({
    description: 'Minutos de anticipación para notificar al vecino antes del paso del camión. Rango: 1–60.',
    example: 10,
    minimum: 1,
    maximum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  notifyBefore?: number;

  @ApiPropertyOptional({
    description: 'Activar (true) o desactivar (false) las notificaciones push del vecino.',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  activateNotification?: boolean;
}
