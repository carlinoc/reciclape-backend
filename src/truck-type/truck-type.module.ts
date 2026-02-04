import { Module } from '@nestjs/common';
import { TruckTypeService } from './truck-type.service';
import { TruckTypeController } from './truck-type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruckType } from './entities/truck-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TruckType])],
  controllers: [TruckTypeController],
  providers: [TruckTypeService],
  exports: [TruckTypeService, TypeOrmModule],
})
export class TruckTypeModule {}
