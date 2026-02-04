import { PartialType } from '@nestjs/swagger';
import { CreateCollectionAreaDto } from './create-collection-area.dto';

export class UpdateCollectionAreaDto extends PartialType(
  CreateCollectionAreaDto,
) {}
