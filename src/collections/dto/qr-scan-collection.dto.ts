import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class QrScanCollectionDto {
  @ApiProperty({
    example: 'uuid-del-vecino',
    description: 'ID del vecino que escanea el QR (obtenido del accessToken / storage)',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: '7557e17d-00fd-412b-b95c-2ec47f1830c8',
    description: 'ID del camión — extraído del contenido del código QR escaneado',
  })
  @IsUUID()
  truckId: string;

  @ApiPropertyOptional({
    example: 'uuid-operador',
    description: 'ID del operador que registra la entrega (opcional)',
  })
  @IsOptional()
  @IsUUID()
  operatorUserId?: string;

  @ApiPropertyOptional({
    example: 'Entrega rápida desde app',
    description: 'Nota opcional de la entrega',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
