import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruckConvoysService } from './truck-convoys.service';
import { TruckConvoysController } from './truck-convoys.controller';
import { TruckConvoy } from './entities/truck-convoy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TruckConvoy])],
  controllers: [TruckConvoysController],
  providers: [TruckConvoysService],
  exports: [TruckConvoysService],
})
export class TruckConvoysModule {}
