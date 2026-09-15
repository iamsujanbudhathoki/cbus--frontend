'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { driverSchema, DriverFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Driver, DriverShift, ShiftStatus } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { Label } from '@/components/ui/label';
import { Plus, Search, X, Loader2, History, Clock, Bus, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function DriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Admin View Driver Shift Logs Modal State
  const [selectedDriverLogs, setSelectedDriverLogs] = useState<Driver | null>(null);
  const [shiftLogs, setShiftLogs] = useState<DriverShift[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      phone: '',
      licenseNumber: '',
    },
  });

  const fetchDrivers = async () => {
    if (!user?.collegeId) return;
    setIsLoading(true);
    try {
      const data = await api.getDrivers(user.collegeId);
      setDrivers(data);
    } catch (e: any) {
      toast.error('Failed to load driver records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [user]);

  const handleOpenLogs = async (driver: Driver) => {
    setSelectedDriverLogs(driver);
    setIsLogsLoading(true);
    try {
      const logs = await api.getAdminDriverShifts(user?.collegeId, driver.id);
      setShiftLogs(logs);
    } catch (e: any) {
      toast.error('Failed to load driver shift logs');
    } finally {
      setIsLogsLoading(false);
    }
  };

  const handleCreateDriver = async (data: DriverFormData) => {
    if (!user?.collegeId) return;
    setIsSubmitting(true);

    try {
      await api.createDriver({
        collegeId: user.collegeId,
        ...data,
      });
      toast.success(`Driver ${data.name} registered successfully!`);
      setIsCreateOpen(false);
      reset();
      fetchDrivers();
    } catch (e: any) {
      toast.error(e.message || 'Failed to register driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDuration = (totalSec?: number) => {
    if (!totalSec) return '0m';
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Driver Directory</h1>
              <p className="text-sm text-slate-500">Manage vehicle drivers, credentials, and work session history</p>
            </div>

            <button
              onClick={() => {
                reset();
                setIsCreateOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add New Driver
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search driver by name, phone or license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 shadow-sm"
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
            {isLoading ? (
              <div className="py-12 space-y-4">
                <div className="h-6 w-1/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            ) : filteredDrivers.length === 0 ? (
              <EmptyState
                title="No Drivers Found"
                description={
                  searchTerm
                    ? `No drivers matching "${searchTerm}". Try a different search term.`
                    : 'No drivers registered yet for this college.'
                }
                actionLabel={searchTerm ? undefined : 'Add First Driver'}
                onAction={
                  searchTerm
                    ? undefined
                    : () => {
                        reset();
                        setIsCreateOpen(true);
                      }
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5">Driver Name</th>
                      <th className="px-4 py-3.5">Phone</th>
                      <th className="px-4 py-3.5">License Number</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Shift Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDrivers.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{d.name}</td>
                        <td className="px-4 py-3.5 text-slate-700">{d.phone}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-600 font-bold">
                          {d.licenseNumber || '-'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenLogs(d)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer active:scale-95 transition-all"
                          >
                            <History className="h-3.5 w-3.5" />
                            View Shift Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create Driver Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Add New Driver</h3>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleCreateDriver)} className="mt-4 space-y-3">
                  <div>
                    <Label required className="mb-1">
                      Driver Full Name
                    </Label>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Ramesh Bahadur Chhetri"
                      className={`w-full rounded-xl border p-2.5 text-sm focus:outline-none transition-all ${
                        errors.name
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs font-medium text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label required className="mb-1">
                        Phone Number
                      </Label>
                      <input
                        type="text"
                        {...register('phone')}
                        placeholder="+977 9841234567"
                        className={`w-full rounded-xl border p-2.5 text-sm focus:outline-none transition-all ${
                          errors.phone
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs font-medium text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                    <div>
                      <Label required className="mb-1">
                        License Number
                      </Label>
                      <input
                        type="text"
                        {...register('licenseNumber')}
                        placeholder="DL-NP-2022-9988"
                        className={`w-full rounded-xl border p-2.5 text-sm focus:outline-none transition-all ${
                          errors.licenseNumber
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                      />
                      {errors.licenseNumber && (
                        <p className="mt-1 text-xs font-medium text-red-500">{errors.licenseNumber.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsCreateOpen(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        'Create Driver'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Admin Driver Shift Logs Modal */}
          {selectedDriverLogs && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Work Session Logs for {selectedDriverLogs.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Operational shift history, recorded timestamps, and reported notes
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDriverLogs(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
                  {isLogsLoading ? (
                    <div className="py-8 text-center space-y-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                      <p className="text-xs text-slate-400">Loading shift logs...</p>
                    </div>
                  ) : shiftLogs.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                      <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
                      <p>No shift logs recorded for this driver yet.</p>
                    </div>
                  ) : (
                    shiftLogs.map((shift) => (
                      <div
                        key={shift.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                shift.status === ShiftStatus.RUNNING
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {shift.status}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {formatDate(shift.startedAt)}
                            </span>
                          </div>

                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {formatDuration(shift.durationSeconds)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Bus Operated:</span>
                            <span className="font-bold text-slate-900">
                              {shift.busNumberSnap || shift.bus?.busNumber || 'N/A'}
                            </span>{' '}
                            <span className="font-mono text-[11px] text-blue-600">
                              ({shift.vehicleNumberSnap || shift.bus?.vehicleNumber || 'N/A'})
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[11px] block">Shift Time:</span>
                            <span className="font-semibold text-slate-800">
                              {formatTime(shift.startedAt)} - {formatTime(shift.endedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600">
                          <span className="text-slate-400 text-[11px] block">Assigned Route:</span>
                          <span className="font-semibold text-slate-800">
                            {shift.routeNameSnap || shift.route?.name || 'Unassigned'}
                          </span>
                        </div>

                        {shift.notes && (
                          <div className="rounded-lg bg-white border border-slate-200 p-2 text-[11px] text-slate-700 font-medium">
                            <span className="font-bold text-slate-500">Driver Notes: </span>
                            {shift.notes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
                  <button
                    onClick={() => setSelectedDriverLogs(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
