import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilterCollectionAreaDto {
    @ApiProperty({
        description: 'Filtrar por zoneId',
    })
    @IsString()
    zoneId: string;

    @ApiPropertyOptional({
        description: 'Filtrar por tipo de área (opcional)'
    })
    @IsOptional()
    @IsString()
    areaTypeId?: string;
}