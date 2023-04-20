import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

import { PrismaHealthIndicator } from '../prisma';
import { AcessTokenGuard } from 'src/common/guards';

@Controller('health')
@ApiTags('health')
class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private memoryHealthIndicator: MemoryHealthIndicator,
    private prismaHealthIndicator: PrismaHealthIndicator,
  ) {}

  @Get()
  @UseGuards(AcessTokenGuard)
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () =>
        this.memoryHealthIndicator.checkHeap('memory heap', 300 * 1024 * 1024),
      () =>
        this.memoryHealthIndicator.checkRSS('memory RSS', 300 * 1024 * 1024),
      () => this.prismaHealthIndicator.isHealthy('Prisma'),
    ]);
  }
}

export default HealthController;
