import { IsOptional, IsUUID, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ComplaintStatus } from './update-complaint.dto';

export class FilterComplaintsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por municipalidad' })
  @IsUUID()
  @IsOptional()
  municipalityId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por vecino (userId)' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoría' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ComplaintStatus, description: 'Filtrar por estado' })
  @IsEnum(ComplaintStatus)
  @IsOptional()
  status?: ComplaintStatus;
}
