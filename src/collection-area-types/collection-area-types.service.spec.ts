import { Test, TestingModule } from '@nestjs/testing';
import { CollectionAreaTypesService } from './collection-area-types.service';

describe('CollectionAreaTypesService', () => {
  let service: CollectionAreaTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionAreaTypesService],
    }).compile();

    service = module.get<CollectionAreaTypesService>(CollectionAreaTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
