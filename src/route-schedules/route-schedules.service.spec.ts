import { Test, TestingModule } from '@nestjs/testing';
import { RouteSchedulesService } from './route-schedules.service';

describe('RouteSchedulesService', () => {
  let service: RouteSchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouteSchedulesService],
    }).compile();

    service = module.get<RouteSchedulesService>(RouteSchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
