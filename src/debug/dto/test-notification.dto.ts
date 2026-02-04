import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

// Crea un archivo DTO para que Swagger lo reconozca automáticamente
export class TestNotificationDto {
  @ApiProperty({ example: 'uuid-del-usuario', description: 'ID del usuario en la DB' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ required: false, example: 'Título de prueba' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, example: 'Mensaje de prueba' })
  @IsString()
  @IsOptional()
  message?: string;
}
