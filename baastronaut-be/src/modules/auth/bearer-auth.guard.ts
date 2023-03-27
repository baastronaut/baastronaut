import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, IS_USER_API } from '../../utils/constants';

@Injectable()
export class BearerAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const isUserApi = this.reflector.getAllAndOverride<boolean>(IS_USER_API, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isUserApi) {
      return true;
    }

    return super.canActivate(context);
  }
}
