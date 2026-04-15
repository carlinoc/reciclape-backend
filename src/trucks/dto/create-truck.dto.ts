import { IsUUID, IsString, IsOptional, Length, IsBoolean, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { RegistrationStatus } from '../enums/registration-status.enum';

export class CreateTruckDto {
  @ApiProperty({ example: 'ABC-123', description: 'Placa del camión (nullable para vehículos pendientes de placa)' })
  @IsString()
  @Length(3, 20)
  @IsOptional()
  licensePlate?: string;

  @ApiProperty({ example: 'uuid-truckType' })
  @IsUUID()
  truckTypeId: string;

  @ApiProperty({ example: 'uuid-device' })
  @IsUUID()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({ example: 'QR1234567890', description: 'Código QR del camión' })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiProperty({ description: 'Estado del camión (true/false). Opcional.', required: false, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  @IsOptional()
  municipalityId?: string;

  @ApiProperty({ example: 'uuid-operator' })
  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @ApiProperty({ example: 8000, description: 'Capacidad del camión en kg' })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @ApiProperty({ example: 12, description: 'Volumen del camión en m³' })
  @IsOptional()
  @IsInt()
  @Min(0)
  volume?: number;

  @ApiProperty({ enum: RegistrationStatus, example: RegistrationStatus.ACTIVE, description: 'Estado de registro/placa del camión' })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  registrationStatus?: RegistrationStatus;
}
