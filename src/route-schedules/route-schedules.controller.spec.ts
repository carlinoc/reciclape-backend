import { Test, TestingModule } from '@nestjs/testing';
import { RouteSchedulesController } from './route-schedules.controller';

describe('RouteSchedulesController', () => {
  let controller: RouteSchedulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RouteSchedulesController],
    }).compile();

    controller = module.get<RouteSchedulesController>(RouteSchedulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
