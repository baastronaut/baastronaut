import { ApiClient } from 'client/api-client';
import { useAuth } from 'components/auth/AuthProvider';
import { useMemo } from 'react';

export function useApiClient() {
  const { user } = useAuth();
  const userToken = user!.token;

  const apiClient = useMemo(() => {
    return new ApiClient(userToken);
  }, [userToken]);

  return apiClient;
}
