import { Test, TestingModule } from '@nestjs/testing';
import HealthController from './health.controller';
import { HealthCheckService } from '@nestjs/terminus';
import { MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '../prisma';

describe('HealthController', () => {
  let healthController: HealthController;
  let healthCheckService: HealthCheckService;
  let memoryHealthIndicator: MemoryHealthIndicator;
  let prismaHealthIndicator: PrismaHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthCheckService,
        MemoryHealthIndicator,
        PrismaHealthIndicator,
      ],
    })
      .overrideProvider(HealthCheckService)
      .useValue({ check: jest.fn(() => Promise.resolve({})) })
      .overrideProvider(MemoryHealthIndicator)
      .useValue({
        checkHeap: jest.fn(() => Promise.resolve({})),
        checkRSS: jest.fn(() => Promise.resolve({})),
      })
      .overrideProvider(PrismaHealthIndicator)
      .useValue({ isHealthy: jest.fn(() => Promise.resolve({})) })
      .compile();

    healthController = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    memoryHealthIndicator = module.get<MemoryHealthIndicator>(
      MemoryHealthIndicator,
    );
    prismaHealthIndicator = module.get<PrismaHealthIndicator>(
      PrismaHealthIndicator,
    );
  });

  it('should be defined', () => {
    expect(healthController).toBeDefined();
  });

  it('should call all health indicators in check()', async () => {
    const checkSpy = jest.spyOn(healthCheckService, 'check');
    await healthController.check();

    const checkCall = checkSpy.mock.calls[0][0];
    const checkHeapCall = checkCall[0];
    const checkRSSCall = checkCall[1];
    const isHealthyCall = checkCall[2];

    expect(checkSpy).toHaveBeenCalled();

    await checkHeapCall();
    expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
      'memory heap',
      300 * 1024 * 1024,
    );

    await checkRSSCall();
    expect(memoryHealthIndicator.checkRSS).toHaveBeenCalledWith(
      'memory RSS',
      300 * 1024 * 1024,
    );

    await isHealthyCall();
    expect(prismaHealthIndicator.isHealthy).toHaveBeenCalledWith('Prisma');
  });
});
