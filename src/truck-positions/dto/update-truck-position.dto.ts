import { PartialType } from '@nestjs/swagger';
import { CreateTruckPositionDto } from './create-truck-position.dto';

export class UpdateTruckPositionDto extends PartialType(CreateTruckPositionDto) {}
