'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Role, User } from './types';
import { api } from './api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refetchUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api
      .getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    if (userData.role === Role.ADMIN) {
      router.push('/super-admin/dashboard');
    } else if (userData.role === Role.COLLEGE) {
      router.push('/college-admin/dashboard');
    } else if (userData.role === Role.PARENT) {
      router.push('/parent/dashboard');
    } else if (userData.role === Role.DRIVER) {
      router.push('/driver/dashboard');
    } else {
      router.push('/login');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const refetchUser = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (e) {
      console.error('Failed to refetch user profile', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
