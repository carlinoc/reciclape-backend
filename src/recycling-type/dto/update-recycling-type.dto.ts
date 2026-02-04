import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRecyclingTypeDto } from './create-recycling-type.dto';

export class UpdateRecyclingTypeDto extends PartialType(
  OmitType(CreateRecyclingTypeDto, ['municipalityId'] as const),
) {}
