import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { Public } from '../../utils/constants';
import { authedUserToProfile } from '../../utils/helpers';
import { AuthedRequest, AuthService } from '../auth/auth.service';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import {
  RegisterUserReq,
  UsersService,
  VerifyEmailReq,
} from '../users/users.service';

export type LoginResp = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  allowedWorkspaces: {
    workspaceId: number;
    workspaceName: string;
    role: string;
  }[];
  token: string;
};

/**
 * Only public endpoints should be put here. NO authed endpoints.
 */
@Public()
@Controller()
export class PublicUsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() registerUserReq: RegisterUserReq) {
    await this.usersService.register(registerUserReq);
  }

  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailReq: VerifyEmailReq) {
    await this.usersService.verifyEmail(verifyEmailReq);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: AuthedRequest): LoginResp {
    const userBasicDetailsWithAccessToken = this.authService.login(req.user);
    return {
      ...authedUserToProfile(userBasicDetailsWithAccessToken),
      token: userBasicDetailsWithAccessToken.token,
    };
  }
}
