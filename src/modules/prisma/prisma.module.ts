import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaHealthIndicator } from './health/primaHealthIndicator.health';

@Global()
@Module({
  providers: [PrismaService, PrismaHealthIndicator],
  exports: [PrismaService, PrismaHealthIndicator],
})
export class PrismaModule {}
