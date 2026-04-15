import { IsNotEmpty, IsOptional, IsString, Length, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({example: 'Calle 123', description: 'Calle del domicilio'})
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: '123', description: 'Número del domicilio', required: false })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({ example: 'Apt 123', description: 'Apartamento del domicilio', required: false })
  @IsOptional()
  @IsString()
  apartment?: string;

  @ApiProperty({ example: -71.53745 })
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: -16.40904 })
  @IsNumber()
  latitude?: number;
  
  @ApiProperty({ example: 'Zona ID', description: 'ID de la zona' })
  @IsString()
  @IsNotEmpty()
  zoneId: string;

  @ApiProperty({ example: 'QR123456', description: 'Código QR asociado al domicilio', required: false })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiProperty({ example: '080105', description: 'ID del distrito (6 caracteres)' })
  @IsString()
  @Length(6, 6)
  districtId: string;

  @ApiProperty({ example: 'Usuario ID', description: 'ID del usuario' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 10,
    description: 'Minutos de anticipación para notificar al vecino según tiempo estimado de llegada del camión. Valores válidos: 5, 10, 15. Si es null, se usa el modo por proximidad (radio de 200m).',
    required: false,
    enum: [5, 10, 15],
  })
  @IsOptional()
  @IsNumber()
  @IsIn([5, 10, 15], { message: 'notifyBefore debe ser 5, 10 o 15 minutos' })
  notifyBefore?: number;
}
