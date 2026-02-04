import { Test, TestingModule } from '@nestjs/testing';
import { CollectionAreasController } from './collection-areas.controller';

describe('CollectionAreasController', () => {
  let controller: CollectionAreasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionAreasController],
    }).compile();

    controller = module.get<CollectionAreasController>(CollectionAreasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
