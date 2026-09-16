'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bus, TrackingStatus } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatWidget } from '@/components/shared/stat-widget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { GraduationCap, Bus as BusIcon, Route, Navigation, Radio, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CollegeAdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.collegeId) return;

    Promise.all([
      api.getCollegeMetrics(user.collegeId),
      api.getBuses(user.collegeId),
    ])
      .then(([m, b]) => {
        setMetrics(m);
        setBuses(b);
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-5">
          <PageHeader
            title={user?.college?.name || 'College Dashboard'}
            description="Overview of college buses, students, and live tracking"
            action={
              <Link href="/college-admin/live-tracking">
                <Button size="sm" className="gap-2">
                  <Radio className="h-3.5 w-3.5 text-red-300 animate-pulse shrink-0" />
                  Live Bus Map
                </Button>
              </Link>
            }
          />

          {/* Stat Summary Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatWidget
              title="Registered Students"
              value={metrics?.totalStudents ?? '-'}
              icon={GraduationCap}
            />
            <StatWidget
              title="Total Buses"
              value={metrics?.totalBuses ?? '-'}
              icon={BusIcon}
            />
            <StatWidget
              title="Moving Buses"
              value={metrics?.activeBuses ?? '-'}
              icon={Navigation}
            />
            <StatWidget
              title="Bus Routes"
              value={metrics?.totalRoutes ?? '-'}
              icon={Route}
            />
          </div>

          {/* Fleet Status Summary Table */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bus Live Status</h2>
                <p className="text-xs font-medium text-slate-700">Overview of drivers, routes, and live location</p>
              </div>
              <Link href="/college-admin/buses" className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                Manage Buses <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 space-y-3">
                <div className="h-5 w-1/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            ) : buses.length === 0 ? (
              <EmptyState
                title="No Buses Added"
                description="Start by adding buses and assigning drivers and routes."
                actionLabel="Add Bus"
                onAction={() => window.location.href = '/college-admin/buses'}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bus Number</TableHead>
                    <TableHead>Vehicle Plate</TableHead>
                    <TableHead>Assigned Driver</TableHead>
                    <TableHead>Assigned Route</TableHead>
                    <TableHead>Tracking Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buses.map((b) => {
                    const trackingStatus = b.tracking?.trackingStatus || TrackingStatus.OFFLINE;
                    let badgeVariant: 'emerald' | 'yellow' | 'secondary' = 'secondary';
                    if (trackingStatus === TrackingStatus.LIVE) badgeVariant = 'emerald';
                    else if (trackingStatus === TrackingStatus.STALE) badgeVariant = 'yellow';

                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-bold text-slate-900">{b.busNumber}</TableCell>
                        <TableCell className="font-mono text-slate-600">{b.vehicleNumber}</TableCell>
                        <TableCell className="text-slate-700">{b.driver?.name || <span className="text-slate-400 italic">Unassigned</span>}</TableCell>
                        <TableCell className="text-slate-700">{b.assignedRoute?.name || <span className="text-slate-400 italic">Unassigned</span>}</TableCell>
                        <TableCell>
                          <Badge variant={badgeVariant}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              trackingStatus === TrackingStatus.LIVE ? 'bg-emerald-500 animate-pulse' : trackingStatus === TrackingStatus.STALE ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                            {trackingStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
