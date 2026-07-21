import { useState, useEffect } from 'react';
import { onAuthChanged, signOutUser } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Setting up auth state listener');
    
    const unsubscribe = onAuthChanged((user) => {
      console.log('useAuth: Auth state changed', user ? 'User logged in' : 'No user');
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('useAuth: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };
};