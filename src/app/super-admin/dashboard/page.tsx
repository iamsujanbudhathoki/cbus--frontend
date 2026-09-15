'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { College, Status } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { School, Bus, GraduationCap, Navigation, Plus, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPlatformMetrics(), api.getColleges()])
      .then(([m, c]) => {
        setMetrics(m);
        setColleges(c);
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">System Super Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Platform-wide multi-tenant transportation overview</p>
            </div>

            <Link
              href="/super-admin/colleges"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add New College
            </Link>
          </div>

          {/* Metric Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-blue-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <School className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Colleges</p>
                <p className="text-2xl font-black text-slate-900">{metrics?.totalColleges ?? '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-emerald-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Students</p>
                <p className="text-2xl font-black text-slate-900">{metrics?.totalStudents ?? '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-indigo-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <Bus className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Fleet Buses</p>
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
          </div>

          {/* College Overview Table */}
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Registered Institutions / Colleges</h2>
              <Link href="/super-admin/colleges" className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                Manage All Colleges &rarr;
              </Link>
            </div>

            {isLoading ? (
              <div className="py-12 space-y-4">
                <div className="h-6 w-1/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            ) : colleges.length === 0 ? (
              <EmptyState
                title="No Colleges Registered"
                description="Get started by registering educational institutions on the platform."
                actionLabel="Register First College"
                onAction={() => window.location.href = '/super-admin/colleges'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5">College Name</th>
                      <th className="px-4 py-3.5">Code</th>
                      <th className="px-4 py-3.5">Address</th>
                      <th className="px-4 py-3.5">Contact</th>
                      <th className="px-4 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {colleges.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{c.name}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-600 font-bold">{c.code}</td>
                        <td className="px-4 py-3.5 text-slate-600">{c.address || '-'}</td>
                        <td className="px-4 py-3.5 text-slate-600">{c.contactPhone || c.contactEmail || '-'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            c.status === Status.ACTIVE ? 'bg-emerald-50 border border-emerald-200/60 text-emerald-700' : 'bg-red-50 border border-red-200/60 text-red-700'
                          }`}>
                            {c.status === Status.ACTIVE ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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
