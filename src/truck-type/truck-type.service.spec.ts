import { Test, TestingModule } from '@nestjs/testing';
import { TruckTypeService } from './truck-type.service';

describe('TruckTypeService', () => {
  let service: TruckTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TruckTypeService],
    }).compile();

    service = module.get<TruckTypeService>(TruckTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
