import { IsBoolean, IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComplaintCategoryDto {
  @ApiProperty({ example: 'No recolectó basura' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'El camión no pasó por la zona asignada' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'HIGH' })
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: '9ae8dab4-d959-4e37-8599-e54531b585bb' })
  @IsUUID()
  municipalityId: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
