import { ApiClient } from '../../client/api-client';

const userStorageKey = 'user';
const currentWorkspaceKey = 'currentWs';

export type UserCallBack = (
  user: User | null,
  currentWorkspace: AuthWorkspace | null,
  error?: { message: string },
) => void;

export type WorkspaceChangeCallback = (
  currentWorkspace: AuthWorkspace | null,
  skipRedirect?: boolean,
) => void;

export type AuthWorkspace = {
  role: string;
  workspaceId: number;
  workspaceName: string;
};

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  allowedWorkspaces: AuthWorkspace[];
};

export class Auth {
  cb: UserCallBack | null = null;
  workspaceChangeCb: WorkspaceChangeCallback | null = null;
  apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  onAuthStateChanged = (
    cb: UserCallBack,
    workspaceChangeCb: WorkspaceChangeCallback,
  ) => {
    this.cb = cb;
    this.workspaceChangeCb = workspaceChangeCb;
  };

  protected onUserChange = (
    user: User | null,
    currentWorkspace: AuthWorkspace | null,
    error?: { message: string },
  ) => {
    this.cb && this.cb(user, currentWorkspace, error);
  };

  protected onWorkspaceChange = (
    currentWorkspace: AuthWorkspace | null,
    skipRedirect?: boolean,
  ) => {
    this.workspaceChangeCb &&
      this.workspaceChangeCb(currentWorkspace, skipRedirect);
  };

  signIn = async (email: string, password: string) => {
    try {
      const loginResp = await this.apiClient.login(email, password);
      const user: User = {
        id: loginResp.id,
        firstName: loginResp.firstName,
        lastName: loginResp.lastName || '',
        email: loginResp.email,
        token: loginResp.token,
        allowedWorkspaces: loginResp.allowedWorkspaces,
      };
      window.sessionStorage.setItem(userStorageKey, JSON.stringify(user));
      const currentWorkspace = this.checkSetCurrentWorkspace(
        user.allowedWorkspaces,
      );
      this.onUserChange(user, currentWorkspace);
    } catch (err) {
      this.onUserChange(null, null, { message: (err as Error).message });
    }
  };

  signOut = () => {
    window.sessionStorage.removeItem(userStorageKey);
    this.onUserChange(null, null);
  };

  resolveUser = () => {
    const user = this.getCurrentUser();
    let currentWorkspace: AuthWorkspace | null = null;
    if (user) {
      currentWorkspace = this.checkSetCurrentWorkspace(user.allowedWorkspaces);
    }

    this.onUserChange(user, currentWorkspace);
  };

  setCurrentWorkspace = async (workspaceId: number, skipRedirect?: boolean) => {
    const user = this.getCurrentUser();
    if (!user) {
      console.error('Unable to set current workspace without a current user.');
      return;
    }
    const workspace = user.allowedWorkspaces.find(
      (ws) => ws.workspaceId === workspaceId,
    );
    if (!workspace) {
      console.error(
        `Workspace ${workspaceId} is not in user's list of allowed workspaces: ${user.allowedWorkspaces}.`,
      );
      return;
    }
    window?.localStorage.setItem(
      currentWorkspaceKey,
      JSON.stringify(workspace),
    );
    this.onWorkspaceChange(workspace, skipRedirect);
  };

  private getCurrentUser = (): User | null => {
    const signedInUser = window?.sessionStorage.getItem(userStorageKey);
    let user: User | null;
    if (signedInUser) {
      user = JSON.parse(signedInUser);
    } else {
      user = null;
    }
    return user;
  };

  private checkSetCurrentWorkspace = (
    allowedWorkspaces: AuthWorkspace[],
  ): AuthWorkspace => {
    const currentWorkspace = window?.localStorage.getItem(currentWorkspaceKey);
    let workspace: AuthWorkspace | null = null;
    if (currentWorkspace) {
      workspace = JSON.parse(currentWorkspace);
    }

    if (
      !workspace ||
      !allowedWorkspaces.find((ws) => ws.workspaceId === workspace?.workspaceId)
    ) {
      workspace = allowedWorkspaces[0];
      window?.localStorage.setItem(
        currentWorkspaceKey,
        JSON.stringify(workspace),
      );
    }

    return workspace;
  };
}
