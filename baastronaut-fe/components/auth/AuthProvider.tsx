import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Routes } from '../../utils/constants';
import { Auth, AuthWorkspace, User } from './auth';

const auth = new Auth();

export const AuthContext = React.createContext<
  | {
      auth: Auth;
      initializing: boolean;
      user: User | null;
      currentWorkspace: AuthWorkspace | null;
      error: { message: string } | null;
    }
  | undefined
>(undefined);

AuthContext.displayName = 'AuthContext';

export function useAuth() {
  const auth = React.useContext(AuthContext);

  if (!auth) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return auth;
}

export function AuthProvider({ children }: { children: JSX.Element }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [currentWorkspace, setCurrentWorkspace] =
    useState<AuthWorkspace | null>(null);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    auth.onAuthStateChanged(
      (
        user: User | null,
        currentWorkspace: AuthWorkspace | null,
        error?: { message: string },
      ) => {
        setUser(user);
        setCurrentWorkspace(currentWorkspace);
        if (error) {
          setError(error);
        } else {
          setError(null);
        }
        setInitializing(false);
      },
      (currentWorkspace: AuthWorkspace | null, skipRedirect?: boolean) => {
        setCurrentWorkspace(currentWorkspace);
        if (!skipRedirect) {
          // doing this instead of router.push() so that it does a complete reload of the page
          window.location.pathname = Routes.PROJECTS;
        }
      },
    );

    auth.resolveUser();
  }, []);

  const value = {
    user,
    currentWorkspace,
    error,
    auth,
    initializing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
