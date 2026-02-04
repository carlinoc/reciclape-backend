import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginOperatorDto {
  @ApiProperty({ example: 'operador@municipio.gob.pe' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Operator12345' })
  @IsString()
  @MinLength(8)
  password: string;
}
