import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateWorkScheduleDto } from './create-work-schedule.dto';

// No se permite cambiar userId, workDate ni municipalityId en un update
export class UpdateWorkScheduleDto extends PartialType(
  OmitType(CreateWorkScheduleDto, ['userId', 'workDate', 'municipalityId'] as const),
) {}
