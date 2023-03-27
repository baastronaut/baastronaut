import { Controller, Get, Request } from '@nestjs/common';
import { authedUserToProfile } from '../../utils/helpers';
import { AuthedRequest } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor() {}

  @Get('profile')
  async getAuthedUserProfile(@Request() authedRequest: AuthedRequest) {
    return authedUserToProfile(authedRequest.user);
  }
}
