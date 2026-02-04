import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'Samuel' })
  @IsString() 
  name: string;

  @ApiProperty({ example: 'Tapia' })
  @IsString() 
  lastName: string;
  
  @ApiProperty({ example: 'samuel.tapia@gmail.com' })
  @IsEmail() 
  email: string;

  @ApiProperty({ example: '12345678' })
  @IsString() 
  @MinLength(8) 
  password: string;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID() 
  municipalityId: string;
  
  @ApiProperty({ example: '123456789' })
  @IsOptional() 
  @IsString() 
  phone?: string;

  @ApiProperty({ example: '123456789' })
  @IsOptional() 
  @IsString() 
  dni?: string;

  // Datos de Dirección
  @ApiProperty({ example: 'Calle 123' })
  @IsString() 
  street: string;

  @ApiProperty({ example: '45A' })
  @IsOptional() 
  @IsString() 
  number?: string;

  @ApiProperty({ example: 'uuid-zone' })
  @IsUUID() 
  zoneId: string;

  @ApiProperty({ example: 'districtId' })
  @IsString() 
  districtId: string;

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
}
