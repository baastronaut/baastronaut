export enum Routes {
  SIGN_OUT = '/sign-out',
  SIGN_UP = '/sign-up',
  ACCOUNT = '/account',
  PROJECTS = '/projects',
  PROJECT = '/workspaces/[workspaceId]/projects/[projectId]',
  PROJECT_DOCS = '/workspaces/[workspaceId]/projects/[projectId]/docs',
  DEVELOPER = '/developer',
}

// a random enough name to prevent conflict with user defined values
// the presence of this property in a row indicates that the row is newly created and
// not saved to server
export const NEW_ROW_PROP_NAME = '__baTmpNewRow42638';

export function isNewRow(row: any): boolean {
  return !!row[NEW_ROW_PROP_NAME];
}
