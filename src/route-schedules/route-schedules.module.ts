import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteSchedulesService } from './route-schedules.service';
import { RouteSchedulesController } from './route-schedules.controller';
import { RouteSchedule } from './entities/route-schedule.entity';
import { TruckTrip } from '../truck-trips/entities/truck-trip.entity';
import { Truck } from '../trucks/entities/truck.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RouteSchedule, TruckTrip, Truck])],
  controllers: [RouteSchedulesController],
  providers: [RouteSchedulesService],
  exports: [RouteSchedulesService],
})
export class RouteSchedulesModule {}
