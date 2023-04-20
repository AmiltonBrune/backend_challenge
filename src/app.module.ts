import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AcessTokenGuard } from './common/guards';
import { PrismaModule } from './modules/prisma';
import { HealthModule } from './modules/health';
import { AuthModule } from './modules/auth';
import { LandscapeModule } from './modules/landscapes';
import { UserModule } from './modules/user';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    LandscapeModule,
    UserModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AcessTokenGuard,
    },
  ],
})
export class AppModule {}
