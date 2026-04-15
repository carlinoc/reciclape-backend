import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ConvoyRole } from '../enums/convoy-role.enum';

export class CreateTruckConvoyDto {
  @ApiProperty({ example: '2025-06-10', description: 'Fecha operativa del convoy' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'uuid-truck', description: 'ID del camión compactador (principal)' })
  @IsUUID()
  mainTruckId: string;

  @ApiProperty({ example: 'uuid-truck', description: 'ID del camión de apoyo (furgón o volquete)' })
  @IsUUID()
  supportTruckId: string;

  @ApiProperty({ enum: ConvoyRole, example: ConvoyRole.ORGANIC_SUPPORT, description: 'Rol del camión de apoyo' })
  @IsEnum(ConvoyRole)
  role: ConvoyRole;

  @ApiProperty({ example: 'uuid-municipality' })
  @IsUUID()
  municipalityId: string;
}
