import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, IsUUID, IsNumber, IsLatitude, IsLongitude, IsOptional, IsBoolean } from 'class-validator';

export class CreateNeighborDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Perez' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'juan.perez@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678' }) 
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;
  
  @ApiProperty({ example: 'uuid-zone' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ example: 'districtId' })
  @IsString()
  districtId: string;
  
  @ApiProperty({ example: '123456789' })
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  dni?: string;

  @ApiProperty({ example: 'Calle 123' })
  @IsString()
  street: string;

  @ApiProperty({ example: '45A' })
  @IsString()
  number?: string;

  @ApiProperty({ example: 'Apartamento 45A', required: false })
  @IsOptional()
  @IsString()
  apartment?: string;

  @ApiProperty({ example: 12.345678 })
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -12.345678 })
  @IsNumber()
  @IsLongitude()
  longitude: number;

  @ApiProperty({
    description: 'Estado del vecino (true/false). Opcional.',
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

  @ApiProperty({
    description: 'FCM Token del dispositivo del vecino',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiProperty({
    description: 'Dispositivo del vecino',
    required: false,
    type: String,
    example: 'Android',
  })
  @IsOptional()
  @IsString()
  device?: string;
}
