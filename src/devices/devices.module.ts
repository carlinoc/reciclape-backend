import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Device } from './entities/device.entity';
import { Truck } from 'src/trucks/entities/truck.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Truck])],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
