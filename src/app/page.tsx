'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === UserRole.ADMIN) {
        router.push('/super-admin/dashboard');
      } else if (user.role === UserRole.COLLEGE) {
        router.push('/college-admin/dashboard');
      } else if (user.role === UserRole.PARENT) {
        router.push('/parent/dashboard');
      } else if (user.role === UserRole.DRIVER) {
        router.push('/driver/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <span className="text-4xl animate-bounce">🚌</span>
        <p className="mt-4 text-sm font-semibold">Redirecting to your BusTracker portal...</p>
      </div>
    </div>
  );
}
