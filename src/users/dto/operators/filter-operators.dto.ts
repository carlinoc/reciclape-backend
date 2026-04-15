import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsBoolean, IsString, IsUUID, IsEnum } from 'class-validator';
import { PersonnelRole } from 'src/users/enums/personnel-role.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterOperatorsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por municipalityId' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por zonaId, opcional', type: String })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por districtId, opcional', type: String })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado activo', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar por estado archivado, opcional', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ enum: PersonnelRole, description: 'Filtrar por rol del personal' })
  @IsOptional()
  @IsEnum(PersonnelRole)
  personnelRole?: PersonnelRole;
}