import { Test, TestingModule } from '@nestjs/testing';
import { TruckPositionsService } from './truck-positions.service';

describe('TruckPositionsService', () => {
  let service: TruckPositionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TruckPositionsService],
    }).compile();

    service = module.get<TruckPositionsService>(TruckPositionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
