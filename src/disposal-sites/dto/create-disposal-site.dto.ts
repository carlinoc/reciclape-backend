import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateDisposalSiteDto {
  @ApiProperty({ example: 'Botadero Jara', description: 'Nombre del sitio de disposición final' })
  @IsString()
  @Length(1, 150)
  name: string;

  @ApiProperty({ example: '(-13.5319,-71.9675)', description: 'Coordenadas del sitio (point de PostgreSQL)', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
