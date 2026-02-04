import { Test, TestingModule } from '@nestjs/testing';
import { CollectionAreasService } from './collection-areas.service';

describe('CollectionAreasService', () => {
  let service: CollectionAreasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionAreasService],
    }).compile();

    service = module.get<CollectionAreasService>(CollectionAreasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
