import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginNeighborDto {
  @ApiProperty({ example: 'vecino@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'FCM Token del dispositivo del vecino',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
