import { IsUUID, IsString, IsOptional, Length, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTruckDto {
  @ApiProperty({ example: 'ABC-123'})
  @IsString()
  @Length(3, 20)
  licensePlate: string;

  @ApiProperty({ example: 'uuid-truckType' })
  @IsUUID()
  truckTypeId: string;

  @ApiProperty({ example: 'uuid-zone' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ example: 'uuid-device' })
  @IsUUID()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({ example: 'QR1234567890', description: 'Código QR del camión' })
  @IsOptional()
  @IsString()
  qrCode: string;

  @ApiProperty({
    description: 'Estado del camión (true/false). Opcional.',
    required: false,
    type: Boolean,
  })
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
}
