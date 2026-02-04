import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { Collection } from './entities/collection.entity';
import { CollectionItem } from './entities/collection-item.entity';
import { PointsTransaction } from './entities/points-transaction.entity';
import { UserPoint } from 'src/user-points/entities/user-point.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Collection, CollectionItem, PointsTransaction, UserPoint])],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
