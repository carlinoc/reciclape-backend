import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Column } from 'typeorm';

export class CreateCollectionAreaDto {
  @ApiProperty({ example: 'Carigrande', description: 'Nombre de la área' })
  @IsString()
  @IsNotEmpty()
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ example: 'uuid-zone', description: 'ID del zona' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ example: 'uuid-area-type', description: 'ID del tipo de area' })
  @IsUUID()
  areaTypeId: string;
}
