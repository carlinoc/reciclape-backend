import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { AdminRole } from '../../enums/admin-role.enum';

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

  @ApiPropertyOptional({ example: '987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  dni?: string;

  @ApiPropertyOptional({
    description: 'Rol del administrador. SUPER_ADMIN: acceso total, puede crear otros admins. ADMIN: gestión operativa diaria.',
    enum: AdminRole,
    default: AdminRole.ADMIN,
    example: AdminRole.ADMIN,
  })
  @IsOptional()
  @IsEnum(AdminRole)
  adminRole?: AdminRole = AdminRole.ADMIN;

  // Datos de Dirección
  @ApiProperty({ example: 'Calle 123' })
  @IsString()
  street: string;

  @ApiPropertyOptional({ example: '45A' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({ example: 'uuid-zone', description: 'ID de la zona. Opcional.' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null) ? undefined : value)
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({ example: '080105', description: 'ID del distrito. Si se omite se obtiene automáticamente desde la municipalidad.' })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiPropertyOptional({ description: 'Estado activo del admin', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
