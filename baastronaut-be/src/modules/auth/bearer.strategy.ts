import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthedUser, AuthService } from './auth.service';

@Injectable()
export class BearerStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('APP_JWT_PUBLIC_KEY') appJwtPubKey: string,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appJwtPubKey,
      algorithms: ['RS512'],
    });
  }

  async validate(payload: any): Promise<AuthedUser> {
    const authedUser = await this.authService.getAuthedUserById(payload.sub);
    if (!authedUser) {
      throw new UnauthorizedException('No such user.');
    }

    return authedUser;
  }
}
