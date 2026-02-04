import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteSchedulesService } from './route-schedules.service';
import { RouteSchedulesController } from './route-schedules.controller';
import { RouteSchedule } from './entities/route-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RouteSchedule])],
  controllers: [RouteSchedulesController],
  providers: [RouteSchedulesService],
  exports: [RouteSchedulesService],
})
export class RouteSchedulesModule {}
