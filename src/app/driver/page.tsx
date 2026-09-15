'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/driver/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Redirecting to Driver Portal...</p>
      </div>
    </div>
  );
}
