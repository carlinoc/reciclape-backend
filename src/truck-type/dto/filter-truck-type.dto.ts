import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTruckTypeDto {  
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