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
import { Bell, BellOff } from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
} from '@/lib/notifications';
import { toast } from 'sonner';

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
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

  const handleToggleNotifications = async () => {
    const current = getNotificationPermission();
    if (current === 'granted') {
      toast.info('Browser alerts are already active. Sending test notification...');
      sendBrowserNotification('🔔 Bus Alerts Working!', {
        body: 'Browser alerts are working properly and will alert you during live trips.',
      });
      return;
    }

    if (current === 'denied') {
      window.dispatchEvent(new CustomEvent('busapp:open-notif-help'));
      return;
    }

    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      toast.success('Browser notifications enabled!');
      sendBrowserNotification('🔔 Bus Tracking Alerts Active', {
        body: 'You will now receive real-time bus alerts even when this tab is in the background.',
      });
    } else if (res === 'denied') {
      window.dispatchEvent(new CustomEvent('busapp:open-notif-help'));
    }
  };

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
      { label: 'Live Bus Tracking', href: '/college-admin/live-tracking', icon: Navigation },
      { label: 'Students', href: '/college-admin/students', icon: GraduationCap },
      { label: 'Parents', href: '/college-admin/parents', icon: Users },
      { label: 'Buses', href: '/college-admin/buses', icon: Bus },
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
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer md:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link href={dashboardHref} className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm shrink-0 overflow-hidden">
              <img src="/busapp-logo.jpg" alt="Bus App Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                BusTracker Pro
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 truncate max-w-[160px]">
                {roleLabel}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Side Header Controls */}
        <div className="flex items-center gap-2">
          {/* Browser Notification Bell Toggle */}
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title={
              notifPermission === 'granted'
                ? 'Browser notifications are active'
                : 'Click to enable live browser notifications'
            }
            aria-label="Toggle live notifications"
          >
            {notifPermission === 'granted' ? (
              <>
                <Bell className="h-4 w-4 text-blue-600" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 text-slate-400" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
              </>
            )}
          </button>

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white p-1.5 pr-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-xs"
            aria-expanded={isProfileDropdownOpen}
            aria-label="User profile menu"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-[10px] font-bold text-white shrink-0">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-slate-900 leading-none">{user.name}</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-700 transition-transform duration-150 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-lg bg-white p-2 shadow-md border border-slate-200 z-[99999] text-xs">
              {/* User Identity Header */}
              <div className="rounded-md bg-slate-50 p-2.5 border border-slate-200 mb-1.5">
                <p className="font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-700 font-medium truncate flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3 shrink-0 text-slate-600" />
                  {user.email}
                </p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-800 bg-white border border-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    <Shield className="h-2.5 w-2.5 text-slate-700" />
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Extra Account Info if available */}
              {(user.phoneNumber || user.collegeName) && (
                <div className="px-2 py-1.5 text-[11px] text-slate-700 space-y-1 border-b border-slate-100 pb-1.5 mb-1.5">
                  {user.collegeName && (
                    <p className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                      <School className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      {user.collegeName}
                    </p>
                  )}
                  {user.phoneNumber && (
                    <p className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Phone className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      {user.phoneNumber}
                    </p>
                  )}
                </div>
              )}

              {/* Navigation Options */}
              <div className="space-y-0.5">
                <Link
                  href={dashboardHref}
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-slate-500" />
                  Main Dashboard
                </Link>
              </div>

              {/* Divider & Logout Action */}
              <div className="mt-1.5 border-t border-slate-100 pt-1.5">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsLogoutConfirmOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-600" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[99999] flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-64 flex-col bg-white p-4 shadow-xl z-[99999] border-r border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <img src="/busapp-logo.jpg" alt="Bus App Logo" className="h-6 w-6 rounded-md object-cover border border-slate-200" />
                <span className="text-base font-bold text-slate-900">Navigation</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 rounded-md bg-slate-50 p-2.5 border border-slate-200">
              <p className="text-xs font-bold text-slate-900">{user.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">{roleLabel}</p>
            </div>

            <nav className="space-y-1 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-100 mt-auto">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLogoutConfirmOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-600 cursor-pointer hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
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
        description="Are you sure you want to log out of your session? You will need to sign in again to access the admin portal."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        variant="destructive"
      />
    </>
  );
}
