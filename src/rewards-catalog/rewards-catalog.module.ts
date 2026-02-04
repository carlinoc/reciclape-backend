import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsCatalogController } from './rewards-catalog.controller';
import { RewardsCatalogService } from './rewards-catalog.service';
import { RewardCatalog } from './entities/reward-catalog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RewardCatalog])],
  controllers: [RewardsCatalogController],
  providers: [RewardsCatalogService],
  exports: [RewardsCatalogService],
})
export class RewardsCatalogModule {}
