import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AcessTokenGuard } from 'src/common/guards';
import { LandscapesService } from './landscapes.service';

@Controller('landscapes')
@ApiTags('landscapes')
class LandscapesController {
  constructor(private landscapesService: LandscapesService) {}

  @Get()
  @UseGuards(AcessTokenGuard)
  listAll() {
    return this.landscapesService.getLandscapes();
  }
}

export default LandscapesController;
