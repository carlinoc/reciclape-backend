import { Test, TestingModule } from '@nestjs/testing';
import { DailyCrewAssignmentsController } from './daily-crew-assignments.controller';

describe('DailyCrewAssignmentsController', () => {
  let controller: DailyCrewAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyCrewAssignmentsController],
    }).compile();

    controller = module.get<DailyCrewAssignmentsController>(DailyCrewAssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
