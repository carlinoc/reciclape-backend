import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecyclingType } from './entities/recycling-type.entity';
import { RecyclingTypeController } from './recycling-type.controller';
import { RecyclingTypeService } from './recycling-type.service';

@Module({
  imports: [TypeOrmModule.forFeature([RecyclingType])],
  controllers: [RecyclingTypeController],
  providers: [RecyclingTypeService],
  exports: [RecyclingTypeService],
})
export class RecyclingTypeModule {}
