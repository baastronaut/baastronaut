import { SetMetadata } from '@nestjs/common';

export const USER_APIS_ROOT_PATH = '/api/data';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const IS_USER_API = 'isUserApi';
export const UserApi = () => SetMetadata(IS_USER_API, true);

export enum FRONTEND_PATHS {
  VERIFY_EMAIL = '/verify-email',
  WS_INVITE = '/workspace-invite',
}

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  DATA_COLLABORATOR = 'DATA_COLLABORATOR',
}
