import { Test, TestingModule } from '@nestjs/testing';
import { RewardsCatalogService } from './rewards-catalog.service';

describe('RewardsCatalogService', () => {
  let service: RewardsCatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RewardsCatalogService],
    }).compile();

    service = module.get<RewardsCatalogService>(RewardsCatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
