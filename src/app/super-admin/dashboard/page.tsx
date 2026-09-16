'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { College, Status } from '@/lib/types';
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
import { School, Bus, GraduationCap, Navigation, Plus, ArrowRight } from 'lucide-react';
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
        <main className="flex-1 p-4 md:p-6 space-y-5">
          <PageHeader
            title="System Admin Overview"
            description="Multi-tenant platform statistics and institutional transport monitoring"
            action={
              <Link href="/super-admin/colleges">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add College
                </Button>
              </Link>
            }
          />

          {/* Stat Summary Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatWidget
              title="Total Colleges"
              value={metrics?.totalColleges ?? '-'}
              icon={School}
            />
            <StatWidget
              title="Total Students"
              value={metrics?.totalStudents ?? '-'}
              icon={GraduationCap}
            />
            <StatWidget
              title="Total Fleet Buses"
              value={metrics?.totalBuses ?? '-'}
              icon={Bus}
            />
            <StatWidget
              title="Active Moving Buses"
              value={metrics?.activeBuses ?? '-'}
              icon={Navigation}
            />
          </div>

          {/* Institutional Overview Table */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Registered Educational Institutions</h2>
                <p className="text-xs font-medium text-slate-700">Manage multi-tenant institutional accounts</p>
              </div>
              <Link href="/super-admin/colleges" className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                Manage All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 space-y-3">
                <div className="h-5 w-1/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            ) : colleges.length === 0 ? (
              <EmptyState
                title="No Colleges Registered"
                description="Get started by registering educational institutions on the platform."
                actionLabel="Register First College"
                onAction={() => window.location.href = '/super-admin/colleges'}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>College Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colleges.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold text-slate-900">
                        <Link href={`/super-admin/colleges/${c.id}`} className="hover:text-blue-600 hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-slate-600">{c.code}</TableCell>
                      <TableCell className="text-slate-600">{c.address || '-'}</TableCell>
                      <TableCell className="text-slate-600">{c.contactPhone || c.contactEmail || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === Status.ACTIVE ? 'emerald' : 'destructive'}>
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
