import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateNeighborDto } from './create-neighbor.dto';

export class UpdateNeighborDto extends PartialType(
    OmitType(CreateNeighborDto, ['password'] as const),
) {}
