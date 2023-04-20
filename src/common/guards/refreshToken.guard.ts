import { AuthGuard } from '@nestjs/passport';

export class RefreshTokentGuard extends AuthGuard('jwt-refresh') {
  constructor() {
    super();
  }
}
