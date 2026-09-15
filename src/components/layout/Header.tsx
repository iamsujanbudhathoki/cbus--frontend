'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Role } from '@/lib/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  LogOut,
  User as UserIcon,
  Menu,
  X,
  LayoutDashboard,
  School,
  GraduationCap,
  Users,
  Bus,
  Route,
  Navigation,
  UserCheck,
  ChevronDown,
  Shield,
  Phone,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  const roleLabel =
    user.role === Role.ADMIN
      ? 'System Admin'
      : user.role === Role.COLLEGE
      ? user.college?.name || 'College Admin'
      : user.role === Role.PARENT
      ? 'Parent Portal'
      : user.role === Role.DRIVER
      ? 'Bus Driver'
      : user.role;

  let dashboardHref = '/login';
  if (user.role === Role.ADMIN) dashboardHref = '/super-admin/dashboard';
  else if (user.role === Role.COLLEGE) dashboardHref = '/college-admin/dashboard';
  else if (user.role === Role.PARENT) dashboardHref = '/parent/dashboard';
  else if (user.role === Role.DRIVER) dashboardHref = '/driver/dashboard';

  let navItems: { label: string; href: string; icon: any }[] = [];
  if (user.role === Role.ADMIN) {
    navItems = [
      { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
      { label: 'Colleges', href: '/super-admin/colleges', icon: School },
    ];
  } else if (user.role === Role.COLLEGE) {
    navItems = [
      { label: 'Dashboard', href: '/college-admin/dashboard', icon: LayoutDashboard },
      { label: 'Live Fleet Tracking', href: '/college-admin/live-tracking', icon: Navigation },
      { label: 'Students', href: '/college-admin/students', icon: GraduationCap },
      { label: 'Parents', href: '/college-admin/parents', icon: Users },
      { label: 'Fleet Buses', href: '/college-admin/buses', icon: Bus },
      { label: 'Drivers', href: '/college-admin/drivers', icon: UserCheck },
      { label: 'Routes & Stops', href: '/college-admin/routes', icon: Route },
    ];
  } else if (user.role === Role.PARENT) {
    navItems = [
      { label: 'Child Bus Tracking', href: '/parent/dashboard', icon: Navigation },
    ];
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer md:hidden active:scale-95 transition-all"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href={dashboardHref} className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-all">
              <span className="text-xl">🚌</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                BusTracker Pro
              </h1>
              <p className="text-xs font-medium text-slate-500 truncate max-w-[140px] sm:max-w-none">{roleLabel}</p>
            </div>
          </Link>
        </div>

        {/* Right Side User Profile Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-3 rounded-full bg-slate-100/80 p-1.5 pr-3.5 border border-slate-200/80 hover:bg-slate-200/60 hover:border-slate-300 transition-all cursor-pointer active:scale-95"
            aria-expanded={isProfileDropdownOpen}
            aria-label="User profile menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm shrink-0">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[10px] font-semibold text-slate-500 truncate max-w-[120px]">
                {user.role === Role.ADMIN ? 'Administrator' : user.email}
              </p>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Card */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-3 shadow-2xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity Header */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100 mb-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-base font-black text-white shadow-md shadow-blue-500/20 shrink-0">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-extrabold text-sm text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                    {user.email}
                  </p>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Shield className="h-2.5 w-2.5" />
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extra Account Info if available */}
              {(user.phoneNumber || user.collegeName) && (
                <div className="px-3 py-1.5 text-xs text-slate-500 space-y-1 border-b border-slate-100 pb-2 mb-2">
                  {user.collegeName && (
                    <p className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                      <School className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      {user.collegeName}
                    </p>
                  )}
                  {user.phoneNumber && (
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {user.phoneNumber}
                    </p>
                  )}
                </div>
              )}

              {/* Navigation Options */}
              <div className="space-y-1">
                <Link
                  href={dashboardHref}
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4 text-blue-600" />
                  Main Dashboard
                </Link>
              </div>

              {/* Divider & Logout Action */}
              <div className="mt-2 border-t border-slate-100 pt-2">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsLogoutConfirmOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer active:scale-95"
                >
                  <LogOut className="h-4 w-4 text-red-600" />
                  Sign Out of Account
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-4/5 max-w-xs flex-col bg-white p-5 shadow-2xl z-50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚌</span>
                <span className="font-bold text-slate-900">Navigation</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-3 border border-slate-100">
              <p className="text-xs font-semibold text-slate-800">{user.name}</p>
              <p className="text-[11px] text-slate-500">{user.email}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">{roleLabel}</p>
            </div>

            <nav className="space-y-1.5 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLogoutConfirmOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-600 cursor-pointer active:scale-95 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={logout}
        title="Sign Out Confirmation"
        description="Are you sure you want to log out of your session? You will need to enter your credentials to sign in again."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        variant="destructive"
      />
    </>
  );
}
