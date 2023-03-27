import { useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';

const SignOut = () => {
  const { auth } = useAuth();

  useEffect(() => {
    auth.signOut();
  }, []);

  return null;
};

SignOut.requireAuth = true;

export default SignOut;
