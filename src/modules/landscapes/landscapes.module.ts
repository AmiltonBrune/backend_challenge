import { Module } from '@nestjs/common';

import LandscapeController from './landscapes.controller';
import { LandscapesService } from './landscapes.service';

@Module({
  imports: [],
  controllers: [LandscapeController],
  providers: [LandscapesService],
})
export class LandscapeModule {}
