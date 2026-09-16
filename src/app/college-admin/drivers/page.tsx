'use client';

import React, { useEffect, useState } from 'react';
import { DriverFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Driver, DriverShift } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/shared/page-header';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { Button } from '@/components/ui/button';
import { DriverTable } from '@/components/drivers/DriverTable';
import { DriverCreateDialog } from '@/components/drivers/DriverCreateDialog';
import { DriverShiftLogsDialog } from '@/components/drivers/DriverShiftLogsDialog';
import { Plus } from 'lucide-react';
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
      toast.success(`Driver ${data.name} registered successfully`);
      setIsCreateOpen(false);
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <PageHeader
            title="Drivers"
            description="Manage drivers, logins, and shift logs"
            action={
              <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Driver
              </Button>
            }
          />

          <TableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search driver by name, phone or license..."
          />

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <DriverTable
              drivers={filteredDrivers}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onOpenLogs={handleOpenLogs}
              onAddDriver={() => setIsCreateOpen(true)}
            />
          </div>

          <DriverCreateDialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreateDriver}
            isSubmitting={isSubmitting}
          />

          <DriverShiftLogsDialog
            selectedDriverLogs={selectedDriverLogs}
            onClose={() => setSelectedDriverLogs(null)}
            shiftLogs={shiftLogs}
            isLogsLoading={isLogsLoading}
          />
        </main>
      </div>
    </div>
  );
}
