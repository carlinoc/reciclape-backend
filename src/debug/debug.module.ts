import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugController } from './debug.controller';
import { Notification } from '../notifications/entities/notification.entity';
import { TruckPosition } from '../truck-positions/entities/truck-position.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, TruckPosition])
  ],
  controllers: [DebugController],
})
export class DebugModule {}
