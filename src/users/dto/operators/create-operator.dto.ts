import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateOperatorDto {
  // Datos de User

  @ApiProperty({ example: 'Oscar' })
  @IsString() 
  name: string;
  
  @ApiProperty({ example: 'Garcia' })
  @IsString() 
  lastName: string;

  @ApiProperty({ example: 'oscar.garcia@gmail.com' })
  @IsEmail() 
  email: string;

  @ApiProperty({ example: '12345678' })
  @IsString() 
  password: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsOptional()
  dni?: string;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID() 
  municipalityId: string;

  // Datos de OperatorProfile
  @ApiProperty({ example: 'DRIVER' })
  @IsString() 
  personnelRole: string;

  @ApiProperty({ example: 'uuid-truck' })
  @IsUUID() 
  @IsOptional() 
  assignedTruckId?: string;

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

  // Datos de Address (Opcional para operadores)
  @ApiProperty({ example: 'Calle 123' })
  @IsString() 
  @IsOptional() 
  street?: string;

  @ApiProperty({ example: '45A' })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiProperty({ example: 'uuid-zone' })
  @IsUUID() 
  @IsOptional() 
  zoneId?: string;

  @ApiProperty({ example: '080501' })
  @IsString() 
  @IsOptional() 
  districtId?: string;
}
