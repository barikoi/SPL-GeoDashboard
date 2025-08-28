import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export const useAuthPersistence = () => {
  const authState = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Save auth state to localStorage whenever it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth', JSON.stringify(authState));
    }
  }, [authState]);

  return authState;
}; 