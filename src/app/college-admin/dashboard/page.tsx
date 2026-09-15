'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bus, College, TrackingStatus } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { GraduationCap, Bus as BusIcon, Route, Navigation, ShieldAlert, ArrowRight, Radio } from 'lucide-react';
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
        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {user?.college?.name || 'College Transportation Portal'}
              </h1>
              <p className="text-sm text-slate-500">Live fleet operations and student transport management</p>
            </div>

            <Link
              href="/college-admin/live-tracking"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Radio className="h-4 w-4 animate-pulse text-red-300 shrink-0" />
              Open Live Fleet Tracking Map
            </Link>
          </div>

          {/* Metric Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-emerald-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Registered Students</p>
                <p className="text-2xl font-black text-slate-900">{metrics?.totalStudents ?? '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-blue-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <BusIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Fleet Buses</p>
                <p className="text-2xl font-black text-slate-900">{metrics?.totalBuses ?? '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-amber-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Navigation className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Active Moving Buses</p>
                <p className="text-2xl font-black text-slate-900">{metrics?.activeBuses ?? '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-indigo-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <Route className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Transport Routes</p>
                <p className="text-2xl font-black text-slate-900">{metrics?.totalRoutes ?? '-'}</p>
              </div>
            </div>
          </div>

          {/* Fleet Status Summary Table */}
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Fleet Bus Status Summary</h2>
              <Link href="/college-admin/buses" className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                Manage Fleet &rarr;
              </Link>
            </div>

            {isLoading ? (
              <div className="py-12 space-y-4">
                <div className="h-6 w-1/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            ) : buses.length === 0 ? (
              <EmptyState
                title="No Buses Configured"
                description="Start by adding fleet buses and assigning drivers and routes."
                actionLabel="Configure Fleet"
                onAction={() => window.location.href = '/college-admin/buses'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5">Bus Number</th>
                      <th className="px-4 py-3.5">Vehicle Plate</th>
                      <th className="px-4 py-3.5">Assigned Driver</th>
                      <th className="px-4 py-3.5">Assigned Route</th>
                      <th className="px-4 py-3.5">Tracking State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {buses.map((b) => {
                      const trackingStatus = b.tracking?.trackingStatus || TrackingStatus.OFFLINE;
                      let statusBadgeClass = 'bg-slate-100 border-slate-200 text-slate-700';
                      if (trackingStatus === TrackingStatus.LIVE) statusBadgeClass = 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold';
                      else if (trackingStatus === TrackingStatus.STALE) statusBadgeClass = 'bg-amber-50 border-amber-200 text-amber-700 font-bold';

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-900">{b.busNumber}</td>
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-blue-600">{b.vehicleNumber}</td>
                          <td className="px-4 py-3.5 text-slate-700">{b.driver?.name || 'Unassigned'}</td>
                          <td className="px-4 py-3.5 text-slate-700">{b.assignedRoute?.name || 'Unassigned'}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${statusBadgeClass}`}>
                              <span className={`h-2 w-2 rounded-full ${
                                trackingStatus === TrackingStatus.LIVE ? 'bg-emerald-500 animate-ping' : trackingStatus === TrackingStatus.STALE ? 'bg-amber-500' : 'bg-slate-400'
                              }`} />
                              {trackingStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
