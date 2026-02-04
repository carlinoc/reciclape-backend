import { Test, TestingModule } from '@nestjs/testing';
import { CollectionAreaTypesController } from './collection-area-types.controller';

describe('CollectionAreaTypesController', () => {
  let controller: CollectionAreaTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionAreaTypesController],
    }).compile();

    controller = module.get<CollectionAreaTypesController>(CollectionAreaTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
