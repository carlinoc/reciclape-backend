import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { PersonnelRole } from '../../enums/personnel-role.enum';

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
  @ApiProperty({ enum: PersonnelRole, example: PersonnelRole.DRIVER })
  @IsEnum(PersonnelRole)
  personnelRole: PersonnelRole;

  @ApiProperty({ example: 'uuid-truck' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null) ? undefined : value)
  @IsUUID()
  assignedTruckId?: string;

  @ApiProperty({ description: 'Indica si el operario pertenece al pool de retenes', required: false, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isRetenPool?: boolean;

  @ApiProperty({ description: 'Estado del operario (true/false). Opcional.', required: false, type: Boolean })
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
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null) ? undefined : value)
  @IsUUID()
  zoneId?: string;

  @ApiProperty({ example: '080501' })
  @IsString() 
  @IsOptional() 
  districtId?: string;
}
