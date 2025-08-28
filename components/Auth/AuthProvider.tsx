'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsClient(true);
    
    // Restore auth state from localStorage on client side
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.isAuthenticated) {
          dispatch(loginSuccess());
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
      }
    }
  }, [dispatch]);

  // Don't render children until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return <>{children}</>;
};

export default AuthProvider; 