import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTruckMunicipalityDto {
    @ApiProperty({
        description: 'Filtrar por municipio'
    })
    @IsString()
    municipalityId?: string;

    @ApiPropertyOptional({
        description: 'Filtrar por tipo de camión, opcional'
    })
    @IsOptional()
    @IsString()
    truckTypeId?: string;

    @ApiPropertyOptional({
        description: 'Filtrar por estado activa (opcional)',
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

    @ApiPropertyOptional({
        description: 'Filtrar por estado archivado, opcional',
        type: Boolean,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isArchived?: boolean;
}