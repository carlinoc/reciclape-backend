import { PartialType } from '@nestjs/swagger';
import { CreateDailyCrewAssignmentDto } from './create-daily-crew-assignment.dto';

export class UpdateDailyCrewAssignmentDto extends PartialType(
  CreateDailyCrewAssignmentDto,
) {}
