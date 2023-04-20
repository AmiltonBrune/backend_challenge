import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import { AcessTokenGuard } from '../../common/guards';
import { GetCurrentUserId } from '../../common/decorators';

@Controller('users')
@ApiTags('users')
class LandscapesController {
  constructor(private userService: UserService) {}

  @Get('me')
  @UseGuards(AcessTokenGuard)
  getUser(@GetCurrentUserId() userId: string) {
    return this.userService.getUserById(userId);
  }
}

export default LandscapesController;
