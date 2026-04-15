import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterTrucksDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filtrar por tipo de camión, opcional' })
    @IsOptional()
    @IsString()
    truckTypeId?: string;

    @ApiPropertyOptional({ description: 'Filtrar por estado activo (opcional)', type: Boolean })
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
}