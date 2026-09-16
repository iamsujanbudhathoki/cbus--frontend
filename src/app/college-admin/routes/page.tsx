'use client';

import React, { useEffect, useState } from 'react';
import { RouteFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Route } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RouteCard } from '@/components/routes/RouteCard';
import { RouteFormDialog } from '@/components/routes/RouteFormDialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function RoutesPage() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Route Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  // Delete Route Confirmation State
  const [deleteRouteTarget, setDeleteRouteTarget] = useState<Route | null>(null);

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
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (route: Route) => {
    setEditingRoute(route);
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
        toast.success(`Route "${data.name}" created`);
      }

      setIsModalOpen(false);
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
      toast.success(`Route "${deleteRouteTarget.name}" removed`);
      setDeleteRouteTarget(null);
      fetchRoutes();
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove route');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <PageHeader
            title="Route & Waypoint Builder"
            description="Configure pickup routes and integrated stop waypoints"
            action={
              <Button onClick={handleOpenCreateModal} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Route
              </Button>
            }
          />

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-8 space-y-3">
                <div className="h-5 w-1/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-24 w-full bg-slate-100 rounded-md animate-pulse" />
                <div className="h-24 w-full bg-slate-100 rounded-md animate-pulse" />
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
                <RouteCard
                  key={route.id}
                  route={route}
                  onEdit={handleOpenEditModal}
                  onDelete={(r) => setDeleteRouteTarget(r)}
                />
              ))
            )}
          </div>

          <RouteFormDialog
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            editingRoute={editingRoute}
            onSubmit={handleSaveRoute}
            isSubmitting={isSubmitting}
          />

          <ConfirmDialog
            isOpen={!!deleteRouteTarget}
            onClose={() => setDeleteRouteTarget(null)}
            onConfirm={handleDeleteRouteConfirm}
            title="Delete Transport Route"
            description={`Are you sure you want to deactivate and remove route "${deleteRouteTarget?.name}"?`}
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
