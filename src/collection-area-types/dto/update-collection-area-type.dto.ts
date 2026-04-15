import { PartialType } from '@nestjs/swagger';
import { CreateCollectionAreaTypeDto } from './create-collection-area-type.dto';

export class UpdateCollectionAreaTypeDto extends PartialType(CreateCollectionAreaTypeDto) {}