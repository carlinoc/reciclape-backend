import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyCrewAssignmentsService } from './daily-crew-assignments.service';
import { DailyCrewAssignmentsController } from './daily-crew-assignments.controller';
import { DailyCrewAssignment } from './entities/daily-crew-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyCrewAssignment])],
  controllers: [DailyCrewAssignmentsController],
  providers: [DailyCrewAssignmentsService],
})
export class DailyCrewAssignmentsModule {}
