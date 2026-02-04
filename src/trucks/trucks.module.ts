import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrucksService } from './trucks.service';
import { TrucksController } from './trucks.controller';
import { Truck } from './entities/truck.entity';
import { OperatorProfile } from 'src/users/entities/operator-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Truck, OperatorProfile])],
  controllers: [TrucksController],
  providers: [TrucksService],
})
export class TrucksModule {}
