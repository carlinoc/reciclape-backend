import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruckPosition } from './entities/truck-position.entity';
import { TruckPositionsService } from './truck-positions.service';
import { TruckPositionsController } from './truck-positions.controller';
import { Truck } from '../trucks/entities/truck.entity';
import { TruckPositionsGateway } from './truck-positions.gateway';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TruckPosition, Truck]),
    NotificationsModule,
  ],
  controllers: [TruckPositionsController],
  providers: [
    TruckPositionsService, 
    TruckPositionsGateway
  ],
  exports: [TruckPositionsService]
})
export class TruckPositionsModule {}
