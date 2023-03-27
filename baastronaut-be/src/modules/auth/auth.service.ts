import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordHashService } from '../password-hash/password-hash.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Request } from 'express';
import { Role } from '../users/user-workspace.entity';

type WorkspaceRole = {
  workspaceId: number;
  workspaceName: string;
  role: Role;
};

export type AuthedUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  allowedWorkspaces: WorkspaceRole[];
};

export type UserBasicDetailsWithAccessToken = AuthedUser & {
  token: string;
};

export type AuthedRequest = Request & { user: AuthedUser };

const logger = new Logger('auth.service');

function toAuthedUser(user: User): AuthedUser {
  const authedUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    allowedWorkspaces:
      user.userWorkspaces?.map((usws) => {
        if (!usws.workspace) {
          logger.warn(
            { userWorkspace: usws },
            'Workspace relation not joined, returning empty string for workspace name.',
          );
        }
        return {
          workspaceId: usws.workspaceId,
          workspaceName: usws.workspace?.name || '',
          role: usws.role,
        };
      }) || [],
  };

  authedUser.allowedWorkspaces.sort(
    (ws1, ws2) => ws1.workspaceId - ws2.workspaceId,
  );

  return authedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private passwordHashService: PasswordHashService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthedUser | null | 'UNVERIFIED'> {
    const user = await this.usersService.findOneByEmailJoinWorkspaces(email);
    if (!user) {
      return null;
    }

    const passwordVerified = await this.passwordHashService.passwordIsCorrect(
      password,
      user.passwordHash,
    );

    if (!passwordVerified) {
      return null;
    }

    if (user.verified) {
      return toAuthedUser(user);
    } else {
      return 'UNVERIFIED';
    }
  }

  login(user: AuthedUser): UserBasicDetailsWithAccessToken {
    const payload = { email: user.email, sub: user.id };
    return {
      ...user,
      token: this.jwtService.sign(payload),
    };
  }

  async getAuthedUserById(id: number): Promise<AuthedUser | null> {
    const user = await this.usersService.findByIdJoinWorkspaces(id);
    if (!user || !user.verified) {
      return null;
    }

    return toAuthedUser(user);
  }
}
