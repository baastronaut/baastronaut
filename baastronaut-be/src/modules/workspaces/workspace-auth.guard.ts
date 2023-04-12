import {
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../../utils/constants';
import { AuthedUser } from '../auth/auth.service';

const ADMINS = new Set<Role>([Role.ADMIN, Role.OWNER]);
const OWNERS = new Set<Role>([Role.OWNER]);

/**
 * This guard requires a "workspaceId" parameter in the path.
 * It checks whether user has access to the workspace referenced by the value of workspaceId.
 */
export class WorkspaceAuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const userWorkspaceRole = getRoleForWorkspace(context);
    if (!userWorkspaceRole) {
      throw new NotFoundException('Workspace not found.');
    }

    return true;
  }
}

export class HasAdminRightsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const userWorkspaceRole = getRoleForWorkspace(context);
    return !userWorkspaceRole ? false : ADMINS.has(userWorkspaceRole.role);
  }
}

export class HasOwnerRightsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const userWorkspaceRole = getRoleForWorkspace(context);
    return !userWorkspaceRole ? false : OWNERS.has(userWorkspaceRole.role);
  }
}

/**
 * Requires workspaceId parameter to be in request path.
 */
function getRoleForWorkspace(context: ExecutionContext) {
  const request = context.switchToHttp().getRequest();
  const user = request.user as AuthedUser;
  const workspaceId = parseInt(request.params?.workspaceId);
  if (!workspaceId || isNaN(workspaceId)) {
    return undefined;
  }

  return user.allowedWorkspaces.find((ws) => ws.workspaceId === workspaceId);
}
