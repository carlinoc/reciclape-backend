import { PartialType } from '@nestjs/swagger';
import { CreateRecyclingTypeDto } from './create-recycling-type.dto';

export class UpdateRecyclingTypeDto extends PartialType(CreateRecyclingTypeDto) {}
