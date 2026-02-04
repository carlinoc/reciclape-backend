import { Test, TestingModule } from '@nestjs/testing';
import { RecyclingTypeController } from './recycling-type.controller';

describe('RecyclingTypeController', () => {
  let controller: RecyclingTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecyclingTypeController],
    }).compile();

    controller = module.get<RecyclingTypeController>(RecyclingTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
