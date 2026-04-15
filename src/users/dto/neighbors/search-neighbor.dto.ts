import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchNeighborDto {
  @ApiProperty({
    description: 'ID de la municipalidad',
    example: '9ae8dab4-d959-4e37-8599-e54531b585bb',
  })
  @IsUUID()
  municipalityId: string;

  @ApiProperty({
    description: 'DNI (solo dígitos) o apellido del vecino. Mínimo 2 caracteres.',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  q: string;
}
