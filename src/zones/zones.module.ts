import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { Zone } from 'src/zones/entities/zones.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Zone])],
  controllers: [ZonesController],
  providers: [ZonesService],
})
export class ZonesModule {}
