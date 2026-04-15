import { PartialType } from '@nestjs/swagger';
import { CreateTruckConvoyDto } from './create-truck-convoy.dto';

export class UpdateTruckConvoyDto extends PartialType(CreateTruckConvoyDto) {}
