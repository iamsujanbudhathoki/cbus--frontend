'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import { Role } from '@/lib/types';
import {
  LayoutDashboard,
  School,
  GraduationCap,
  Users,
  Bus,
  Route,
  Navigation,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();

  if (!user) return null;

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
    <aside
      className={`hidden md:flex flex-col border-r border-slate-200 bg-white p-2 shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-md text-xs transition-all cursor-pointer group ${
                isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-900 font-bold border-l-2 border-blue-600'
                  : 'text-slate-800 font-medium hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                  isActive ? 'text-blue-600' : 'text-slate-600'
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Collapsible Toggle Button */}
      <div className="pt-2 border-t border-slate-200 mt-auto">
        <button
          onClick={toggleSidebar}
          className={`flex items-center gap-2 w-full rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center p-2' : 'px-3 py-2'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
