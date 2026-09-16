'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Role, User } from './types';
import { api } from './api';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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

const PUBLIC_ROUTES = ['/login'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (user && pathname === '/login') {
      if (user.role === Role.ADMIN) {
        router.replace('/super-admin/dashboard');
      } else if (user.role === Role.COLLEGE) {
        router.replace('/college-admin/dashboard');
      } else if (user.role === Role.PARENT) {
        router.replace('/parent/dashboard');
      } else if (user.role === Role.DRIVER) {
        router.replace('/driver/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

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
      setUser(null);
    }
  };

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
