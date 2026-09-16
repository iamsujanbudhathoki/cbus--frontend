'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Bus, College, Driver, Route, Student, Status } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BusTable } from '@/components/buses/BusTable';
import { BusCreateDialog } from '@/components/buses/BusCreateDialog';
import { BusAssignDriverDialog } from '@/components/buses/BusAssignDriverDialog';
import { BusAssignRouteDialog } from '@/components/buses/BusAssignRouteDialog';
import { CollegeEditDialog } from '@/components/colleges/CollegeEditDialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Bus as BusIcon,
  GraduationCap,
  Plus,
  Route as RouteIcon,
  Trash2,
  User,
  Search,
  MapPin,
  Phone,
  Mail,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';

type ActiveTab = 'buses' | 'routes' | 'drivers' | 'students';

export default function CollegeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: collegeId } = use(params);

  const [college, setCollege] = useState<College | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('buses');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isEditCollegeOpen, setIsEditCollegeOpen] = useState(false);
  const [isCreateBusOpen, setIsCreateBusOpen] = useState(false);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [isAssignRouteOpen, setIsAssignRouteOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  // Delete Confirmation Dialog State
  const [deleteConfirmBus, setDeleteConfirmBus] = useState<{ id: string; busNumber: string } | null>(null);

  // Form states
  const [editCollegeForm, setEditCollegeForm] = useState({
    name: '',
    code: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    status: Status.ACTIVE,
  });

  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');

  const fetchCollegeData = async () => {
    if (!collegeId) return;
    setIsLoading(true);
    try {
      const [cData, mData, bData, dData, rData, sData] = await Promise.all([
        api.getCollegeById(collegeId),
        api.getCollegeMetrics(collegeId),
        api.getBuses(collegeId),
        api.getDrivers(collegeId),
        api.getRoutes(collegeId),
        api.getStudents(collegeId),
      ]);
      setCollege(cData);
      setMetrics(mData);
      setBuses(bData);
      setDrivers(dData);
      setRoutes(rData);
      setStudents(sData);

      if (cData) {
        setEditCollegeForm({
          name: cData.name || '',
          code: cData.code || '',
          address: cData.address || '',
          contactPhone: cData.contactPhone || '',
          contactEmail: cData.contactEmail || '',
          status: cData.status || Status.ACTIVE,
        });
      }
    } catch (err: any) {
      toast.error('Failed to load college details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeData();
  }, [collegeId]);

  const handleEditCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId) return;
    setIsSubmitting(true);
    try {
      await api.updateCollege(collegeId, editCollegeForm);
      toast.success('College details updated successfully');
      setIsEditCollegeOpen(false);
      fetchCollegeData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update college details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBus = async (busForm: any) => {
    if (!collegeId) return;
    setIsSubmitting(true);

    try {
      await api.createBus({
        collegeId,
        busNumber: busForm.busNumber,
        vehicleNumber: busForm.registrationNumber,
        capacity: busForm.capacity,
      });
      toast.success(`Bus ${busForm.busNumber} created for ${college?.name || 'College'}`);
      setIsCreateBusOpen(false);
      fetchCollegeData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create bus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;
    setIsSubmitting(true);

    try {
      await api.updateBus(selectedBus.id, {
        driverId: selectedDriverId,
      });
      toast.success(`Driver assigned to ${selectedBus.busNumber}`);
      setIsAssignDriverOpen(false);
      fetchCollegeData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus || !collegeId) return;
    setIsSubmitting(true);

    try {
      await api.assignBusRoute({
        busId: selectedBus.id,
        routeId: selectedRouteId,
        collegeId,
      });
      toast.success(`Route assigned to ${selectedBus.busNumber}`);
      setIsAssignRouteOpen(false);
      fetchCollegeData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteBus = async () => {
    if (!deleteConfirmBus) return;
    setIsSubmitting(true);
    try {
      await api.deleteBus(deleteConfirmBus.id);
      toast.success(`Bus ${deleteConfirmBus.busNumber} deleted`);
      setDeleteConfirmBus(null);
      fetchCollegeData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete bus');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Items
  const filteredBuses = buses.filter(
    (b) =>
      b.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.driver?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.assignedRoute?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoutes = routes.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      (d.licenseNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.className || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link
              href="/super-admin/colleges"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Colleges Directory
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 space-y-3">
              <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse" />
              <div className="h-20 w-full bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-48 w-full bg-slate-200 rounded-lg animate-pulse" />
            </div>
          ) : !college ? (
            <EmptyState
              title="College Not Found"
              description="The requested college profile could not be retrieved."
              actionLabel="Return to Directory"
              onAction={() => (window.location.href = '/super-admin/colleges')}
            />
          ) : (
            <div className="space-y-4">
              {/* Header Info Panel */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-lg shrink-0">
                    🏫
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-slate-900">{college.name}</h1>
                      <Badge variant="default" className="font-mono text-[10px]">
                        {college.code}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-0.5 flex flex-wrap items-center gap-3">
                      {college.address && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-600" />
                          {college.address}
                        </span>
                      )}
                      {college.contactPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-600" />
                          {college.contactPhone}
                        </span>
                      )}
                      {college.contactEmail && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-600" />
                          {college.contactEmail}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={college.status === Status.ACTIVE ? 'emerald' : 'destructive'}>
                    {college.status}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditCollegeOpen(true)}
                    title="Edit Profile"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setIsCreateBusOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Bus
                  </Button>
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div
                  onClick={() => setActiveTab('buses')}
                  className={`rounded-lg border bg-white p-3.5 shadow-xs transition-colors cursor-pointer ${
                    activeTab === 'buses' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-slate-800">
                    <BusIcon className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold">Fleet Buses</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-1">{metrics?.totalBuses ?? buses.length}</p>
                </div>

                <div
                  onClick={() => setActiveTab('routes')}
                  className={`rounded-lg border bg-white p-3.5 shadow-xs transition-colors cursor-pointer ${
                    activeTab === 'routes' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-slate-800">
                    <RouteIcon className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-semibold">Transport Routes</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-1">{metrics?.totalRoutes ?? routes.length}</p>
                </div>

                <div
                  onClick={() => setActiveTab('drivers')}
                  className={`rounded-lg border bg-white p-3.5 shadow-xs transition-colors cursor-pointer ${
                    activeTab === 'drivers' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-slate-800">
                    <User className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold">Fleet Drivers</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-1">{drivers.length}</p>
                </div>

                <div
                  onClick={() => setActiveTab('students')}
                  className={`rounded-lg border bg-white p-3.5 shadow-xs transition-colors cursor-pointer ${
                    activeTab === 'students' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-slate-800">
                    <GraduationCap className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold">Registered Students</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-1">{metrics?.totalStudents ?? students.length}</p>
                </div>
              </div>

              {/* Navigation Tabs & Search Controls */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <Button
                      size="sm"
                      variant={activeTab === 'buses' ? 'default' : 'ghost'}
                      onClick={() => { setActiveTab('buses'); setSearchTerm(''); }}
                    >
                      Buses ({buses.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={activeTab === 'routes' ? 'default' : 'ghost'}
                      onClick={() => { setActiveTab('routes'); setSearchTerm(''); }}
                    >
                      Routes ({routes.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={activeTab === 'drivers' ? 'default' : 'ghost'}
                      onClick={() => { setActiveTab('drivers'); setSearchTerm(''); }}
                    >
                      Drivers ({drivers.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={activeTab === 'students' ? 'default' : 'ghost'}
                      onClick={() => { setActiveTab('students'); setSearchTerm(''); }}
                    >
                      Students ({students.length})
                    </Button>
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={`Search ${activeTab}...`}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* TAB 1: BUSES TABLE */}
                {activeTab === 'buses' && (
                  <BusTable
                    buses={filteredBuses}
                    isLoading={isLoading}
                    searchTerm={searchTerm}
                    onAssignDriver={(b) => {
                      setSelectedBus(b);
                      setSelectedDriverId(b.driverId || drivers[0]?.id || '');
                      setIsAssignDriverOpen(true);
                    }}
                    onAssignRoute={(b) => {
                      setSelectedBus(b);
                      setSelectedRouteId(b.assignedRoute?.id || routes[0]?.id || '');
                      setIsAssignRouteOpen(true);
                    }}
                    onUnassignDriver={async (b) => {
                      await api.updateBus(b.id, { driverId: null });
                      fetchCollegeData();
                    }}
                    onDeleteBus={(b) => setDeleteConfirmBus({ id: b.id, busNumber: b.busNumber })}
                    onAddBus={() => setIsCreateBusOpen(true)}
                  />
                )}

                {/* TAB 2: ROUTES TABLE */}
                {activeTab === 'routes' && (
                  <div>
                    {filteredRoutes.length === 0 ? (
                      <EmptyState
                        title="No Routes Created"
                        description={`No transport routes found for ${college.name}.`}
                      />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Route Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Stops Count</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRoutes.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-bold text-slate-900">{r.name}</TableCell>
                              <TableCell className="text-slate-600">{r.description || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="default">📍 {r.stops?.length || 0} Stops</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={r.status === Status.ACTIVE ? 'emerald' : 'destructive'}>
                                  {r.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {/* TAB 3: DRIVERS TABLE */}
                {activeTab === 'drivers' && (
                  <div>
                    {filteredDrivers.length === 0 ? (
                      <EmptyState
                        title="No Drivers Registered"
                        description={`No bus drivers have been added for ${college.name}.`}
                      />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Driver Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>License Number</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDrivers.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-bold text-slate-900">{d.name}</TableCell>
                              <TableCell className="font-mono text-slate-600">{d.phone}</TableCell>
                              <TableCell className="font-mono text-slate-600">{d.licenseNumber || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={d.status === Status.ACTIVE ? 'emerald' : 'destructive'}>
                                  {d.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {/* TAB 4: STUDENTS TABLE */}
                {activeTab === 'students' && (
                  <div>
                    {filteredStudents.length === 0 ? (
                      <EmptyState
                        title="No Students Registered"
                        description={`No students found for ${college.name}.`}
                      />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Roll Number</TableHead>
                            <TableHead>Class & Section</TableHead>
                            <TableHead>Assigned Bus</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell className="font-bold text-slate-900">{s.name}</TableCell>
                              <TableCell className="font-mono text-slate-600">{s.rollNumber || '-'}</TableCell>
                              <TableCell className="text-slate-600">
                                {s.className ? `${s.className} ${s.section ? `(${s.section})` : ''}` : '-'}
                              </TableCell>
                              <TableCell>
                                {s.assignedBus ? (
                                  <Badge variant="emerald">🚌 {s.assignedBus.busNumber}</Badge>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={s.status === Status.ACTIVE ? 'emerald' : 'destructive'}>
                                  {s.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit College Details Modal */}
          <CollegeEditDialog
            isOpen={isEditCollegeOpen}
            onClose={() => setIsEditCollegeOpen(false)}
            editCollegeForm={editCollegeForm}
            setEditCollegeForm={setEditCollegeForm}
            onSubmit={handleEditCollege}
            isSubmitting={isSubmitting}
          />

          {/* Create Bus Modal */}
          <BusCreateDialog
            isOpen={isCreateBusOpen}
            onClose={() => setIsCreateBusOpen(false)}
            onSubmit={handleCreateBus}
            isSubmitting={isSubmitting}
          />

          {/* Assign Driver Modal */}
          <BusAssignDriverDialog
            isOpen={isAssignDriverOpen}
            onClose={() => setIsAssignDriverOpen(false)}
            selectedBus={selectedBus}
            selectedDriverId={selectedDriverId}
            setSelectedDriverId={setSelectedDriverId}
            drivers={drivers}
            driverAssignmentMap={new Map()}
            onSubmit={handleAssignDriverSubmit}
            isSubmitting={isSubmitting}
          />

          {/* Assign Route Modal */}
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

          {/* Delete Bus Confirmation Dialog */}
          <ConfirmDialog
            isOpen={!!deleteConfirmBus}
            onClose={() => setDeleteConfirmBus(null)}
            onConfirm={confirmDeleteBus}
            title="Delete Fleet Bus"
            description={`Are you sure you want to delete bus "${deleteConfirmBus?.busNumber}"?`}
            confirmLabel="Delete Bus"
            cancelLabel="Cancel"
            variant="destructive"
            isLoading={isSubmitting}
          />
        </main>
      </div>
    </div>
  );
}
