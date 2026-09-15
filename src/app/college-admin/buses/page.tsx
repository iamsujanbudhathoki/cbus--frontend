'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { busSchema, BusFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bus, Driver, Route } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  X,
  Loader2,
  UserCheck,
  UserX,
  Route as RouteIcon,
  Trash2,
  Bus as BusIcon,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BusesPage() {
  const { user } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [isAssignRouteOpen, setIsAssignRouteOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  const [selectedDriverId, setSelectedDriverId] = useState<string>('none');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  // Confirmation dialog state for unassigning driver and deleting bus
  const [unassignDriverTarget, setUnassignDriverTarget] = useState<Bus | null>(null);
  const [deleteBusTarget, setDeleteBusTarget] = useState<Bus | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      busNumber: '',
      registrationNumber: '',
      capacity: 40,
    },
  });

  const fetchData = async () => {
    if (!user?.collegeId) return;
    setIsLoading(true);
    try {
      const [bData, dData, rData] = await Promise.all([
        api.getBuses(user.collegeId),
        api.getDrivers(user.collegeId),
        api.getRoutes(user.collegeId),
      ]);
      setBuses(bData);
      setDrivers(dData);
      setRoutes(rData);
    } catch (e: any) {
      toast.error('Failed to load fleet buses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Map driver assignment status (which bus each driver is currently assigned to)
  const driverAssignmentMap = useMemo(() => {
    const map = new Map<string, { busId: string; busNumber: string }>();
    buses.forEach((b) => {
      if (b.driverId || b.driver?.id) {
        const dId = b.driverId || b.driver?.id;
        if (dId) {
          map.set(dId, { busId: b.id, busNumber: b.busNumber });
        }
      }
    });
    return map;
  }, [buses]);

  const handleCreateBus = async (data: BusFormData) => {
    if (!user?.collegeId) return;
    setIsSubmitting(true);

    try {
      const newBus = await api.createBus({
        collegeId: user.collegeId,
        busNumber: data.busNumber,
        vehicleNumber: data.registrationNumber,
        capacity: data.capacity,
      });
      toast.success(`Bus ${data.busNumber} added to fleet!`);
      setIsCreateOpen(false);
      reset();
      // Update local state immediately
      setBuses((prev) => [newBus, ...prev]);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create bus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;
    setIsSubmitting(true);

    const driverIdToSave = selectedDriverId === 'none' ? null : selectedDriverId;

    try {
      const updatedBus = await api.updateBus(selectedBus.id, {
        driverId: driverIdToSave,
      });

      // Update frontend state immediately with backend response
      setBuses((prevBuses) =>
        prevBuses.map((b) => (b.id === updatedBus.id ? updatedBus : b))
      );

      toast.success(
        driverIdToSave
          ? `Driver assigned to ${selectedBus.busNumber}`
          : `Driver unassigned from ${selectedBus.busNumber}`
      );
      setIsAssignDriverOpen(false);
      fetchData(); // Sync background state
    } catch (e: any) {
      toast.error(e.message || 'Failed to assign driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignDriverConfirm = async () => {
    if (!unassignDriverTarget) return;
    setIsSubmitting(true);

    try {
      const updatedBus = await api.updateBus(unassignDriverTarget.id, {
        driverId: null,
      });

      setBuses((prevBuses) =>
        prevBuses.map((b) => (b.id === updatedBus.id ? updatedBus : b))
      );

      toast.success(`Driver unassigned from ${unassignDriverTarget.busNumber}`);
      setUnassignDriverTarget(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to unassign driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBusConfirm = async () => {
    if (!deleteBusTarget) return;
    setIsSubmitting(true);

    try {
      await api.deleteBus(deleteBusTarget.id);
      setBuses((prevBuses) => prevBuses.filter((b) => b.id !== deleteBusTarget.id));
      toast.success(`Bus ${deleteBusTarget.busNumber} deactivated successfully`);
      setDeleteBusTarget(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to deactivate bus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus || !user?.collegeId) return;
    setIsSubmitting(true);

    try {
      await api.assignBusRoute({
        busId: selectedBus.id,
        routeId: selectedRouteId,
        collegeId: user.collegeId,
      });

      const updatedBus = await api.getBusById(selectedBus.id);
      setBuses((prevBuses) =>
        prevBuses.map((b) => (b.id === updatedBus.id ? updatedBus : b))
      );

      toast.success(`Route assigned to ${selectedBus.busNumber}`);
      setIsAssignRouteOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to assign route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBuses = buses.filter(
    (b) =>
      b.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.driver?.name && b.driver.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Fleet Buses</h1>
              <p className="text-sm text-slate-500">Manage vehicle fleet, driver assignments, and route links</p>
            </div>

            <button
              onClick={() => {
                reset();
                setIsCreateOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Fleet Bus
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by bus number, plate, or driver..."
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
            ) : filteredBuses.length === 0 ? (
              <EmptyState
                title="No Fleet Buses Found"
                description={
                  searchTerm
                    ? `No buses matching "${searchTerm}". Try a different search term.`
                    : 'No buses configured yet for this college fleet.'
                }
                actionLabel={searchTerm ? undefined : 'Add First Bus'}
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
                      <th className="px-4 py-3.5">Bus Number</th>
                      <th className="px-4 py-3.5">Vehicle Plate</th>
                      <th className="px-4 py-3.5">Capacity</th>
                      <th className="px-4 py-3.5">Assigned Driver</th>
                      <th className="px-4 py-3.5">Assigned Route</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBuses.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                            <BusIcon className="h-4 w-4" />
                          </div>
                          {b.busNumber}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-600 font-bold">
                          {b.vehicleNumber}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{b.capacity} Seats</td>

                        {/* Assigned Driver Column */}
                        <td className="px-4 py-3.5">
                          {b.driver ? (
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-800">
                              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>{b.driver.name}</span>
                              <span className="font-normal text-[11px] text-emerald-600">
                                ({b.driver.phone})
                              </span>
                              <button
                                onClick={() => setUnassignDriverTarget(b)}
                                className="ml-1 rounded-full p-0.5 hover:bg-emerald-200/60 text-emerald-700 transition-colors cursor-pointer"
                                title="Unassign driver"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                              <UserX className="h-3.5 w-3.5 text-slate-400" />
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Assigned Route Column */}
                        <td className="px-4 py-3.5">
                          {b.assignedRoute ? (
                            <span className="inline-flex items-center gap-1.5 text-blue-800 font-bold bg-blue-50 border border-blue-200/70 px-2.5 py-1 rounded-full text-xs">
                              <RouteIcon className="h-3.5 w-3.5 text-blue-600" />
                              {b.assignedRoute.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">Unassigned</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedBus(b);
                                setSelectedDriverId(b.driverId || b.driver?.id || 'none');
                                setIsAssignDriverOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer active:scale-95 transition-all"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              {b.driver ? 'Change Driver' : 'Assign Driver'}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedBus(b);
                                setSelectedRouteId(b.assignedRoute?.id || routes[0]?.id || '');
                                setIsAssignRouteOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200/80 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer active:scale-95 transition-all"
                            >
                              <RouteIcon className="h-3.5 w-3.5" />
                              Assign Route
                            </button>

                            <button
                              onClick={() => setDeleteBusTarget(b)}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 cursor-pointer active:scale-95 transition-all"
                              title="Delete Bus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create Bus Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Add Fleet Bus</h3>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleCreateBus)} className="mt-4 space-y-3">
                  <div>
                    <Label required className="mb-1 text-xs font-semibold">
                      Bus Identifier Number
                    </Label>
                    <input
                      type="text"
                      {...register('busNumber')}
                      placeholder="BUS-101"
                      className={`w-full rounded-lg border p-2 text-xs focus:outline-none transition-all ${
                        errors.busNumber
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                      }`}
                    />
                    {errors.busNumber && (
                      <p className="mt-1 text-xs font-medium text-red-500">{errors.busNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <Label required className="mb-1 text-xs font-semibold">
                      Vehicle License Plate
                    </Label>
                    <input
                      type="text"
                      {...register('registrationNumber')}
                      placeholder="BA 3 KHA 5678"
                      className={`w-full rounded-lg border p-2 text-xs focus:outline-none transition-all ${
                        errors.registrationNumber
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                      }`}
                    />
                    {errors.registrationNumber && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        {errors.registrationNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label required className="mb-1 text-xs font-semibold">
                      Seating Capacity
                    </Label>
                    <input
                      type="number"
                      {...register('capacity', { valueAsNumber: true })}
                      placeholder="40"
                      className={`w-full rounded-lg border p-2 text-xs focus:outline-none transition-all ${
                        errors.capacity
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                      }`}
                    />
                    {errors.capacity && (
                      <p className="mt-1 text-xs font-medium text-red-500">{errors.capacity.message}</p>
                    )}
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
                          Creating...
                        </>
                      ) : (
                        'Create Bus'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assign / Reassign Driver Modal */}
          {isAssignDriverOpen && selectedBus && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Assign Driver to {selectedBus.busNumber}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select an available driver or unassign current driver.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAssignDriverOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAssignDriverSubmit} className="mt-4 space-y-4">
                  <div>
                    <Label required className="mb-1.5 text-xs font-semibold">
                      Select Driver
                    </Label>
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue placeholder="Select driver..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs font-medium text-slate-500">
                          🚫 Unassigned (No Driver)
                        </SelectItem>
                        {drivers.map((d) => {
                          const assignment = driverAssignmentMap.get(d.id);
                          const isAssignedToOther =
                            assignment && assignment.busId !== selectedBus.id;
                          const isCurrentBusDriver =
                            assignment && assignment.busId === selectedBus.id;

                          return (
                            <SelectItem
                              key={d.id}
                              value={d.id}
                              className="text-xs"
                            >
                              <div className="flex items-center justify-between w-full gap-2">
                                <span>
                                  👤 {d.name} ({d.phone})
                                </span>
                                {isCurrentBusDriver && (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    Current
                                  </span>
                                )}
                                {isAssignedToOther && (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                    Assigned to {assignment.busNumber}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Warning Notice if selecting a driver assigned to another bus */}
                  {selectedDriverId !== 'none' &&
                    driverAssignmentMap.has(selectedDriverId) &&
                    driverAssignmentMap.get(selectedDriverId)?.busId !== selectedBus.id && (
                      <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800 text-xs">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Driver Currently Assigned</p>
                          <p className="mt-0.5 text-[11px] text-amber-700 leading-relaxed">
                            This driver is currently assigned to{' '}
                            <strong>{driverAssignmentMap.get(selectedDriverId)?.busNumber}</strong>.
                            A driver cannot be actively assigned to multiple buses simultaneously.
                            Unassign them from their current bus first before reassigning.
                          </p>
                        </div>
                      </div>
                    )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsAssignDriverOpen(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Assignment'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assign Route Modal */}
          {isAssignRouteOpen && selectedBus && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Assign Route to {selectedBus.busNumber}
                  </h3>
                  <button
                    onClick={() => setIsAssignRouteOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAssignRouteSubmit} className="mt-4 space-y-4">
                  <div>
                    <Label required className="mb-1.5 text-xs font-semibold">
                      Select Route
                    </Label>
                    <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue placeholder="Select route..." />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((r) => (
                          <SelectItem key={r.id} value={r.id} className="text-xs">
                            {r.name} ({r.stops?.length || 0} Stops)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsAssignRouteOpen(false)}
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
                          Assigning...
                        </>
                      ) : (
                        'Assign Route'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Confirm Unassign Driver Dialog */}
          <ConfirmDialog
            isOpen={!!unassignDriverTarget}
            onClose={() => setUnassignDriverTarget(null)}
            onConfirm={handleUnassignDriverConfirm}
            title="Unassign Driver"
            description={`Are you sure you want to unassign driver "${unassignDriverTarget?.driver?.name}" from bus ${unassignDriverTarget?.busNumber}? The driver will become available for assignment to another bus.`}
            confirmLabel="Unassign Driver"
            cancelLabel="Cancel"
            variant="default"
            isLoading={isSubmitting}
          />

          {/* Confirm Delete Bus Dialog */}
          <ConfirmDialog
            isOpen={!!deleteBusTarget}
            onClose={() => setDeleteBusTarget(null)}
            onConfirm={handleDeleteBusConfirm}
            title="Deactivate Fleet Bus"
            description={`Are you sure you want to deactivate bus ${deleteBusTarget?.busNumber}? The bus will be removed from active fleet operations.`}
            confirmLabel="Deactivate Bus"
            cancelLabel="Cancel"
            variant="destructive"
            isLoading={isSubmitting}
          />
        </main>
      </div>
    </div>
  );
}
