import { IsUUID, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ example: 'uuid-user' })    
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'SYSTEM' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Nueva recolección programada' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'El camión pasará mañana a las 8am' })
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
