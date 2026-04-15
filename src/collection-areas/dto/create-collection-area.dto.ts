import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCollectionAreaDto {
  @ApiProperty({ example: 'Carigrande', description: 'Nombre de la área' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid-route-schedule', description: 'ID de la ruta programada a la que pertenece esta área' })
  @IsUUID()
  routeScheduleId: string;

  @ApiProperty({ example: 'uuid-area-type', description: 'ID del tipo de area' })
  @IsUUID()
  areaTypeId: string;
}
