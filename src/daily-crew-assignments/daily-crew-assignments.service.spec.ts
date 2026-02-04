import { Test, TestingModule } from '@nestjs/testing';
import { DailyCrewAssignmentsService } from './daily-crew-assignments.service';

describe('DailyCrewAssignmentsService', () => {
  let service: DailyCrewAssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyCrewAssignmentsService],
    }).compile();

    service = module.get<DailyCrewAssignmentsService>(DailyCrewAssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
