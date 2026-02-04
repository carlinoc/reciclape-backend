import { IsUUID, IsInt, IsString, IsArray, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVoucherDto {
  @ApiProperty( { example: 'uuid-user' })
  @IsUUID()
  userId: string;

  @ApiProperty( { example: 'uuid-reward-catalog' })
  @IsUUID()
  rewardCatalogId: string;

  @ApiProperty( { example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;

  @ApiPropertyOptional( { example: 'uuid-user' })
  @IsOptional()
  @IsUUID()
  issuedByUserId?: string;
  
}