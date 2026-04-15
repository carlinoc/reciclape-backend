import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterVoucherDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'ID del municipio para filtrar vouchers' })
  @IsUUID()
  municipalityId: string;

  @ApiPropertyOptional({ description: 'ID del catálogo de premios para filtrar vouchers' })
  @IsOptional()
  @IsUUID()
  rewardCatalogId?: string;

  @ApiPropertyOptional({ description: 'ID del vecino para listar sus vouchers' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado: GENERATED · REDEEMED · EXPIRED' })
  @IsOptional()
  @IsString()
  status?: string;
}