import { AuthGuard } from '@nestjs/passport';
import { API_USER_AUTH_GUARD_KEY } from './api-user.strategy';

export class ApiUserGuard extends AuthGuard(API_USER_AUTH_GUARD_KEY) {}
