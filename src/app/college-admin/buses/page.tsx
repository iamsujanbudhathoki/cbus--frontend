'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { BusFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bus, Driver, Route } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/shared/page-header';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BusTable } from '@/components/buses/BusTable';
import { BusCreateDialog } from '@/components/buses/BusCreateDialog';
import { BusAssignDriverDialog } from '@/components/buses/BusAssignDriverDialog';
import { BusAssignRouteDialog } from '@/components/buses/BusAssignRouteDialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BusesPage() {
  const { user } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [isAssignRouteOpen, setIsAssignRouteOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  const [selectedDriverId, setSelectedDriverId] = useState<string>('none');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  // Confirmation targets
  const [unassignDriverTarget, setUnassignDriverTarget] = useState<Bus | null>(null);
  const [deleteBusTarget, setDeleteBusTarget] = useState<Bus | null>(null);

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
      toast.success(`Bus ${data.busNumber} added to fleet`);
      setIsCreateOpen(false);
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

      setBuses((prevBuses) =>
        prevBuses.map((b) => (b.id === updatedBus.id ? updatedBus : b))
      );

      toast.success(
        driverIdToSave
          ? `Driver assigned to ${selectedBus.busNumber}`
          : `Driver unassigned from ${selectedBus.busNumber}`
      );
      setIsAssignDriverOpen(false);
      fetchData();
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
      toast.success(`Bus ${deleteBusTarget.busNumber} deactivated`);
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
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <PageHeader
            title="Fleet Buses"
            description="Manage vehicle fleet, driver assignments, and route links"
            action={
              <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Fleet Bus
              </Button>
            }
          />

          <TableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by bus number, plate, or driver..."
          />

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <BusTable
              buses={filteredBuses}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onAssignDriver={(b) => {
                setSelectedBus(b);
                setSelectedDriverId(b.driverId || b.driver?.id || 'none');
                setIsAssignDriverOpen(true);
              }}
              onAssignRoute={(b) => {
                setSelectedBus(b);
                setSelectedRouteId(b.assignedRoute?.id || routes[0]?.id || '');
                setIsAssignRouteOpen(true);
              }}
              onUnassignDriver={(b) => setUnassignDriverTarget(b)}
              onDeleteBus={(b) => setDeleteBusTarget(b)}
              onAddBus={() => setIsCreateOpen(true)}
            />
          </div>

          <BusCreateDialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreateBus}
            isSubmitting={isSubmitting}
          />

          <BusAssignDriverDialog
            isOpen={isAssignDriverOpen}
            onClose={() => setIsAssignDriverOpen(false)}
            selectedBus={selectedBus}
            selectedDriverId={selectedDriverId}
            setSelectedDriverId={setSelectedDriverId}
            drivers={drivers}
            driverAssignmentMap={driverAssignmentMap}
            onSubmit={handleAssignDriverSubmit}
            isSubmitting={isSubmitting}
          />

          <BusAssignRouteDialog
            isOpen={isAssignRouteOpen}
            onClose={() => setIsAssignRouteOpen(false)}
            selectedBus={selectedBus}
            selectedRouteId={selectedRouteId}
            setSelectedRouteId={setSelectedRouteId}
            routes={routes}
            onSubmit={handleAssignRouteSubmit}
            isSubmitting={isSubmitting}
          />

          <ConfirmDialog
            isOpen={!!unassignDriverTarget}
            onClose={() => setUnassignDriverTarget(null)}
            onConfirm={handleUnassignDriverConfirm}
            title="Unassign Driver"
            description={`Are you sure you want to unassign driver "${unassignDriverTarget?.driver?.name}" from bus ${unassignDriverTarget?.busNumber}?`}
            confirmLabel="Unassign Driver"
            cancelLabel="Cancel"
            variant="default"
            isLoading={isSubmitting}
          />

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
