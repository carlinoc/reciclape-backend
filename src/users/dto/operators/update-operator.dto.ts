import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateOperatorDto } from './create-operator.dto';

export class UpdateOperatorDto extends PartialType(
    OmitType(CreateOperatorDto, ['municipalityId', 'password'] as const),
) {}