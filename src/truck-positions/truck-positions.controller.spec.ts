import { Test, TestingModule } from '@nestjs/testing';
import { TruckPositionsController } from './truck-positions.controller';

describe('TruckPositionsController', () => {
  let controller: TruckPositionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TruckPositionsController],
    }).compile();

    controller = module.get<TruckPositionsController>(TruckPositionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
