import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruckTripsService } from './truck-trips.service';
import { TruckTripsController } from './truck-trips.controller';
import { TruckTrip } from './entities/truck-trip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TruckTrip])],
  controllers: [TruckTripsController],
  providers: [TruckTripsService],
  exports: [TruckTripsService],
})
export class TruckTripsModule {}
