import { Test, TestingModule } from '@nestjs/testing';
import { RecyclingTypeService } from './recycling-type.service';

describe('RecyclingTypeService', () => {
  let service: RecyclingTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecyclingTypeService],
    }).compile();

    service = module.get<RecyclingTypeService>(RecyclingTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
