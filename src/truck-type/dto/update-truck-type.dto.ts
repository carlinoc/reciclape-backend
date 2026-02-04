import { PartialType } from '@nestjs/swagger';
import { CreateTruckTypeDto } from './create-truck-type.dto';

export class UpdateTruckTypeDto extends PartialType(CreateTruckTypeDto) {}
