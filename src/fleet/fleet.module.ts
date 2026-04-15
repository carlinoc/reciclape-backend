import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';
import { Truck } from 'src/trucks/entities/truck.entity';
import { TruckPosition } from 'src/truck-positions/entities/truck-position.entity';
import { RouteSchedule } from 'src/route-schedules/entities/route-schedule.entity';
import { DailyCrewAssignment } from 'src/daily-crew-assignments/entities/daily-crew-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Truck, TruckPosition, RouteSchedule, DailyCrewAssignment])],
  controllers: [FleetController],
  providers: [FleetService],
})
export class FleetModule {}
