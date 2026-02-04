import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetProvincesDto {
  @ApiProperty({ example: '08', description: 'ID del departamento (2 dígitos)' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  departmentId?: string;
}
