import { PartialType } from '@nestjs/swagger';
import { CreateRewardCatalogDto } from './create-reward-catalog.dto';

export class UpdateRewardCatalogDto extends PartialType(CreateRewardCatalogDto) {}
