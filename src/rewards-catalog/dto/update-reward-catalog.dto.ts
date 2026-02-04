import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRewardCatalogDto } from './create-reward-catalog.dto';

export class UpdateRewardCatalogDto extends PartialType(
  OmitType(CreateRewardCatalogDto, ['municipalityId'] as const),
) {}
