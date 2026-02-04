import { IsUUID, IsInt, IsString, IsArray, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationMethod } from '../enums/verification-method.enum';

class CollectionItemDto {
  @ApiProperty( { example: 'uuid-recycling-type' })
  @IsUUID()
  recyclingTypeId: string;

  @ApiProperty( { example: 5 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty( { example: 10 })
  @IsInt()
  @Min(0)
  pointsEarned: number;
}

export class CreateCollectionDto {
  @ApiProperty( { example: 'uuid-user' })
  @IsUUID()
  userId: string;

  @ApiProperty( { example: 'uuid-truck' })
  @IsUUID()
  truckId: string;

  @ApiProperty( { example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;

  @ApiPropertyOptional( { example: 'uuid-user' })
  @IsOptional()
  @IsUUID()
  operatorUserId?: string;

  @ApiProperty( { enum: VerificationMethod })
  @IsString()
  verificationMethod: VerificationMethod;

  @ApiProperty({ type: [CollectionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionItemDto)
  items: CollectionItemDto[];
}
