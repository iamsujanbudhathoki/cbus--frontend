'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Label } from '@/components/ui/label';
import { Shield, School, Users, Lock, Mail, ArrowRight, Loader2, Bus } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, isLoading: authLoading, login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === UserRole.ADMIN) {
        router.replace('/super-admin/dashboard');
      } else if (user.role === UserRole.COLLEGE) {
        router.replace('/college-admin/dashboard');
      } else if (user.role === UserRole.PARENT) {
        router.replace('/parent/dashboard');
      } else if (user.role === UserRole.DRIVER) {
        router.replace('/driver/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError('');
    setIsLoading(true);

    try {
      const res = await api.login(data);
      toast.success(`Welcome back, ${res.user.name}!`);
      login(res.user);
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (role: UserRole) => {
    if (role === UserRole.ADMIN) {
      setValue('email', 'admin@busapp.com');
      setValue('password', 'password123');
      toast.info('Loaded System Admin credentials');
    } else if (role === UserRole.COLLEGE) {
      setValue('email', 'admin@tribhuvan.edu.np');
      setValue('password', 'password123');
      toast.info('Loaded College Admin credentials');
    } else if (role === UserRole.DRIVER) {
      setValue('email', 'driver.ramesh@tribhuvan.edu.np');
      setValue('password', 'password123');
      toast.info('Loaded Driver credentials');
    } else if (role === UserRole.PARENT) {
      setValue('email', 'parent@gmail.com');
      setValue('password', 'password123');
      toast.info('Loaded Parent credentials');
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 text-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400 mb-3" />
          <p className="text-sm font-semibold">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-lg">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1 shadow-lg shadow-blue-500/20 border border-slate-200 overflow-hidden">
            <img src="/busapp-logo.jpg" alt="Bus App Logo" className="h-full w-full object-cover rounded-xl" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Real-Time Bus Tracker</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your school/college transport portal</p>
        </div>

        {formError && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200 text-center">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <Label required className="mb-1.5">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                {...register('email')}
                placeholder="name@institution.edu"
                className={`w-full rounded-xl border bg-white text-slate-900 py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 placeholder:opacity-100 focus:outline-none transition-all [color-scheme:light] ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label required className="mb-1.5">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full rounded-xl border bg-white text-slate-900 py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 placeholder:opacity-100 focus:outline-none transition-all [color-scheme:light] ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-center text-xs font-semibold text-slate-500 mb-2.5">Quick Demo Accounts:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials(UserRole.ADMIN)}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-2 text-center transition-all hover:border-blue-500 hover:bg-blue-50 cursor-pointer active:scale-95"
            >
              <Shield className="h-4 w-4 text-blue-600 mb-1" />
              <span className="text-[10px] font-bold text-slate-800">System Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials(UserRole.COLLEGE)}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-2 text-center transition-all hover:border-blue-500 hover:bg-blue-50 cursor-pointer active:scale-95"
            >
              <School className="h-4 w-4 text-emerald-600 mb-1" />
              <span className="text-[10px] font-bold text-slate-800">College Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials(UserRole.DRIVER)}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-2 text-center transition-all hover:border-blue-500 hover:bg-blue-50 cursor-pointer active:scale-95"
            >
              <Bus className="h-4 w-4 text-purple-600 mb-1" />
              <span className="text-[10px] font-bold text-slate-800">Bus Driver</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials(UserRole.PARENT)}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-2 text-center transition-all hover:border-blue-500 hover:bg-blue-50 cursor-pointer active:scale-95"
            >
              <Users className="h-4 w-4 text-amber-600 mb-1" />
              <span className="text-[10px] font-bold text-slate-800">Parent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
