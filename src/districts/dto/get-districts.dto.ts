import { IsNotEmpty, IsString, Length, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GetDistrictsDto {
  @ApiProperty({ example: '0801', description: 'ID de la provincia (4 dígitos)' })
  @IsString()
  @Length(4, 4)
  @IsNotEmpty()
  provinceId: string;

  @ApiProperty({
    description: 'Filtro de estado activo (true/false). Opcional.',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  // Usamos Transform para manejar la conversión de "true"/"false" (string de la URL) a boolean
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean; // Hacemos que la propiedad sea opcional
}
