import { useAuth } from './AuthProvider';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Routes } from '../../utils/constants';

export function AuthGuard({ children }: { children: JSX.Element }) {
  const { user, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!initializing) {
      if (!user) {
        router.push(
          `/${
            router.pathname !== Routes.SIGN_OUT
              ? `?redirect=${router.asPath}`
              : ''
          }`,
        );
      }
    }
  }, [initializing, user, router.isReady]);

  if (!initializing && user) {
    return <>{children}</>;
  }

  return null;
}
