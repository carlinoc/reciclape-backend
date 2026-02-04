import { Test, TestingModule } from '@nestjs/testing';
import { TruckTypeController } from './truck-type.controller';

describe('TruckTypeController', () => {
  let controller: TruckTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TruckTypeController],
    }).compile();

    controller = module.get<TruckTypeController>(TruckTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
