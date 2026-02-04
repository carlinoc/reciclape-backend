import { Test, TestingModule } from '@nestjs/testing';
import { RewardsCatalogController } from './rewards-catalog.controller';

describe('RewardsCatalogController', () => {
  let controller: RewardsCatalogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RewardsCatalogController],
    }).compile();

    controller = module.get<RewardsCatalogController>(RewardsCatalogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
