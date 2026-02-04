import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFcmTokenDto {
  @ApiProperty({ example: 'fcm_token_ejemplo_123456' })  
  @IsNotEmpty()
  @IsString()
  fcmToken: string;
}