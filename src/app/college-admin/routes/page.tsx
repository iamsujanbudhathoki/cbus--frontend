'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routeSchema, RouteFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Route, RouteStop } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Edit,
  MapPin,
  Clock,
  ArrowUp,
  ArrowDown,
  Navigation,
  Route as RouteIcon,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RoutesPage() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Route Modal State (Create / Edit Route with Waypoints)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  // Delete Route Confirmation State
  const [deleteRouteTarget, setDeleteRouteTarget] = useState<Route | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: '',
      startLocation: '',
      endLocation: '',
      stops: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'stops',
  });

  const fetchRoutes = async () => {
    if (!user?.collegeId) return;
    setIsLoading(true);
    try {
      const data = await api.getRoutes(user.collegeId);
      setRoutes(data);
    } catch (e: any) {
      toast.error('Failed to load transport routes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingRoute(null);
    reset({
      name: '',
      startLocation: '',
      endLocation: '',
      stops: [
        { name: 'Start Pickup Point', latitude: 27.6915, longitude: 85.342, estimatedTime: '07:00 AM' },
        { name: 'Final Destination Stop', latitude: 27.6800, longitude: 85.3100, estimatedTime: '07:45 AM' },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (route: Route) => {
    setEditingRoute(route);

    let startLoc = '';
    let endLoc = '';
    if (route.description && route.description.includes('From ') && route.description.includes(' to ')) {
      const parts = route.description.replace('From ', '').split(' to ');
      startLoc = parts[0] || '';
      endLoc = parts[1] || '';
    } else {
      startLoc = route.stops && route.stops.length > 0 ? route.stops[0].name : '';
      endLoc = route.stops && route.stops.length > 1 ? route.stops[route.stops.length - 1].name : '';
    }

    const existingStops = (route.stops || []).map((s) => ({
      name: s.name,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      estimatedTime: s.estimatedTime || '',
    }));

    reset({
      name: route.name,
      startLocation: startLoc,
      endLocation: endLoc,
      stops: existingStops,
    });
    setIsModalOpen(true);
  };

  const handleSaveRoute = async (data: RouteFormData) => {
    if (!user?.collegeId) return;
    setIsSubmitting(true);

    try {
      const stopsPayload = (data.stops || []).map((stop, idx) => ({
        name: stop.name,
        latitude: Number(stop.latitude),
        longitude: Number(stop.longitude),
        sequence: idx + 1,
        estimatedTime: stop.estimatedTime || '',
      }));

      const description = `From ${data.startLocation} to ${data.endLocation}`;

      if (editingRoute) {
        await api.updateRoute(editingRoute.id, {
          name: data.name,
          description,
          stops: stopsPayload,
        });
        toast.success(`Route "${data.name}" updated successfully`);
      } else {
        await api.createRoute({
          collegeId: user.collegeId,
          name: data.name,
          description,
          stops: stopsPayload,
        });
        toast.success(`Route "${data.name}" created with ${stopsPayload.length} stop waypoints`);
      }

      setIsModalOpen(false);
      reset();
      fetchRoutes();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save transport route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRouteConfirm = async () => {
    if (!deleteRouteTarget) return;
    setIsSubmitting(true);
    try {
      await api.deleteRoute(deleteRouteTarget.id);
      toast.success(`Route "${deleteRouteTarget.name}" removed successfully`);
      setDeleteRouteTarget(null);
      fetchRoutes();
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStopWaypoint = () => {
    append({
      name: '',
      latitude: 27.6915,
      longitude: 85.342,
      estimatedTime: '',
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
              <h1 className="text-2xl font-extrabold text-slate-900">Route & Waypoint Builder</h1>
              <p className="text-sm text-slate-500">Configure pickup routes and integrated stop waypoints</p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Route
            </button>
          </div>

          <div className="mt-8 space-y-6">
            {isLoading ? (
              <div className="py-12 space-y-4">
                <div className="h-6 w-1/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-28 w-full bg-slate-100 rounded-2xl animate-pulse" />
                <div className="h-28 w-full bg-slate-100 rounded-2xl animate-pulse" />
              </div>
            ) : routes.length === 0 ? (
              <EmptyState
                title="No Routes Configured"
                description="Create transport routes and add pickup/drop waypoints in one step."
                actionLabel="Add First Route"
                onAction={handleOpenCreateModal}
              />
            ) : (
              routes.map((route) => (
                <div
                  key={route.id}
                  className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-5 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                        <RouteIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{route.name}</h2>
                        <p className="text-xs text-slate-500">{route.description || 'No description provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(route)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer active:scale-95 transition-all"
                        title="Edit Transport Route"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteRouteTarget(route)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 cursor-pointer active:scale-95 transition-all"
                        title="Delete Route"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Integrated Ordered Stop Sequence Display */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 text-blue-600" />
                        Ordered Stop Waypoints ({route.stops?.length || 0}):
                      </h3>
                    </div>

                    {!route.stops || route.stops.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                        <p className="text-xs italic text-slate-400">
                          No stop waypoints configured for this route yet. Click Edit Route to add stops.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {route.stops.map((stop, idx) => (
                          <div
                            key={stop.id || idx}
                            className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-1.5 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-xs">
                                {idx + 1}
                              </span>
                              {stop.estimatedTime && (
                                <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                  <Clock className="h-3 w-3" />
                                  {stop.estimatedTime}
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">{stop.name}</h4>

                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Unified Create / Edit Route Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingRoute ? 'Edit Transport Route' : 'Add Transport Route'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure route details and manage ordered stop waypoints in one place.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Form Content */}
                <form onSubmit={handleSubmit(handleSaveRoute)} className="mt-4 flex flex-col flex-1 overflow-hidden">
                  <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                    {/* Route Basic Info */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Flag className="h-3.5 w-3.5 text-blue-600" />
                        1. Route Overview
                      </h4>

                      <div>
                        <Label required className="mb-1 text-xs font-semibold">
                          Route Name
                        </Label>
                        <input
                          type="text"
                          {...register('name')}
                          placeholder="Route 1: Baneshwor - Kirtipur Express"
                          className={`w-full rounded-lg border p-2 text-xs focus:outline-none transition-all ${
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
                          <Label required className="mb-1 text-xs font-semibold">
                            Start Location
                          </Label>
                          <input
                            type="text"
                            {...register('startLocation')}
                            placeholder="Baneshwor"
                            className={`w-full rounded-lg border p-2 text-xs focus:outline-none transition-all ${
                              errors.startLocation
                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                            }`}
                          />
                          {errors.startLocation && (
                            <p className="mt-1 text-xs font-medium text-red-500">{errors.startLocation.message}</p>
                          )}
                        </div>

                        <div>
                          <Label required className="mb-1 text-xs font-semibold">
                            End Location
                          </Label>
                          <input
                            type="text"
                            {...register('endLocation')}
                            placeholder="Kirtipur"
                            className={`w-full rounded-lg border p-2 text-xs focus:outline-none transition-all ${
                              errors.endLocation
                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                            }`}
                          />
                          {errors.endLocation && (
                            <p className="mt-1 text-xs font-medium text-red-500">{errors.endLocation.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Integrated Stop Waypoints Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Navigation className="h-3.5 w-3.5 text-blue-600" />
                            2. Stop Waypoints ({fields.length})
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Add and sequence pickup/drop waypoints along this route.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddStopWaypoint}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200/80 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer active:scale-95 transition-all shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          + Add Waypoint
                        </button>
                      </div>

                      {fields.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
                          <p className="text-xs text-slate-400">No waypoints added yet.</p>
                          <button
                            type="button"
                            onClick={handleAddStopWaypoint}
                            className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            Click to add first waypoint stop
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2.5 transition-all hover:border-slate-300"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                                    {index + 1}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">
                                    Waypoint Stop #{index + 1}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => move(index, index - 1)}
                                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                                      title="Move Up"
                                    >
                                      <ArrowUp className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {index < fields.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => move(index, index + 1)}
                                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                                      title="Move Down"
                                    >
                                      <ArrowDown className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors"
                                    title="Remove Waypoint"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <Label required className="mb-0.5 text-[11px] font-semibold">
                                    Stop Name
                                  </Label>
                                  <input
                                    type="text"
                                    {...register(`stops.${index}.name` as const)}
                                    placeholder="e.g. Maitighar Mandala Stop"
                                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                                  />
                                  {errors.stops?.[index]?.name && (
                                    <p className="mt-0.5 text-[10px] text-red-500">
                                      {errors.stops[index]?.name?.message}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <Label className="mb-0.5 text-[11px] font-semibold">
                                    Est. Arrival Time
                                  </Label>
                                  <input
                                    type="text"
                                    {...register(`stops.${index}.estimatedTime` as const)}
                                    placeholder="e.g. 07:15 AM"
                                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label required className="mb-0.5 text-[11px] font-semibold">
                                    Latitude
                                  </Label>
                                  <input
                                    type="number"
                                    step="any"
                                    {...register(`stops.${index}.latitude` as const, { valueAsNumber: true })}
                                    placeholder="27.6915"
                                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                                  />
                                </div>
                                <div>
                                  <Label required className="mb-0.5 text-[11px] font-semibold">
                                    Longitude
                                  </Label>
                                  <input
                                    type="number"
                                    step="any"
                                    {...register(`stops.${index}.longitude` as const, { valueAsNumber: true })}
                                    placeholder="85.3420"
                                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-end gap-3 pt-4 mt-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsModalOpen(false)}
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
                          Saving Route...
                        </>
                      ) : editingRoute ? (
                        'Save Route Changes'
                      ) : (
                        'Create Complete Route'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Route Confirmation Dialog */}
          <ConfirmDialog
            isOpen={!!deleteRouteTarget}
            onClose={() => setDeleteRouteTarget(null)}
            onConfirm={handleDeleteRouteConfirm}
            title="Delete Transport Route"
            description={`Are you sure you want to deactivate and remove route "${deleteRouteTarget?.name}"? Buses and students assigned to this route will lose their route assignment.`}
            confirmLabel="Delete Route"
            cancelLabel="Cancel"
            variant="destructive"
            isLoading={isSubmitting}
          />
        </main>
      </div>
    </div>
  );
}
