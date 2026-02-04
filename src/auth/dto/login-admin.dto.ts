import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAdminDto {
  @ApiProperty({ example: 'admin@municipio.gob.pe' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin12345' })
  @IsString()
  @MinLength(8)
  password: string;
}