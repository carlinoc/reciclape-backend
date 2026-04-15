import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyCrewAssignmentsService } from './daily-crew-assignments.service';
import { DailyCrewAssignmentsController } from './daily-crew-assignments.controller';
import { DailyCrewAssignment } from './entities/daily-crew-assignment.entity';
import { OperatorProfile } from 'src/users/entities/operator-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyCrewAssignment, OperatorProfile])],
  controllers: [DailyCrewAssignmentsController],
  providers: [DailyCrewAssignmentsService],
})
export class DailyCrewAssignmentsModule {}
