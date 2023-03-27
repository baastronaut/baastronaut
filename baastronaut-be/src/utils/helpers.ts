import { AuthedUser } from '../modules/auth/auth.service';

export type Profile = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  allowedWorkspaces: {
    workspaceId: number;
    workspaceName: string;
    role: string;
  }[];
};

export function authedUserToProfile(authedUser: AuthedUser): Profile {
  return {
    id: authedUser.id,
    email: authedUser.email,
    firstName: authedUser.firstName,
    lastName: authedUser.lastName,
    allowedWorkspaces: authedUser.allowedWorkspaces.map((ws) => ({
      workspaceId: ws.workspaceId,
      workspaceName: ws.workspaceName,
      role: ws.role,
    })),
  };
}
