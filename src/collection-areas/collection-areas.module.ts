import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionAreasService } from './collection-areas.service';
import { CollectionAreasController } from './collection-areas.controller';
import { CollectionArea } from './entities/collection-area.entity';
import { CollectionAreaTypesModule } from '../collection-area-types/collection-area-types.module';

@Module({
  imports: [TypeOrmModule.forFeature([CollectionArea]), CollectionAreaTypesModule],
  controllers: [CollectionAreasController],
  providers: [CollectionAreasService],
  exports: [CollectionAreasService],
})
export class CollectionAreasModule {}