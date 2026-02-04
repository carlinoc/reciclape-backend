import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionAreaTypesController } from './collection-area-types.controller';
import { CollectionAreaTypesService } from './collection-area-types.service';
import { CollectionAreaType } from './entities/collection-area-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CollectionAreaType])],
  controllers: [CollectionAreaTypesController],
  providers: [CollectionAreaTypesService],
  exports: [CollectionAreaTypesService],
})
export class CollectionAreaTypesModule {}
