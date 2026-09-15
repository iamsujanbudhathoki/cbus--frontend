'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Bus, College, Driver, Route, Student, Status } from '@/lib/types';
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
  ArrowLeft,
  School,
  Bus as BusIcon,
  GraduationCap,
  Navigation,
  Plus,
  CheckCircle,
  XCircle,
  Route as RouteIcon,
  X,
  Loader2,
  Trash2,
  Users,
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

  const [busForm, setBusForm] = useState({
    busNumber: '',
    vehicleNumber: '',
    capacity: 40,
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

  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId) return;
    setIsSubmitting(true);

    try {
      await api.createBus({
        collegeId,
        ...busForm,
      });
      toast.success(`Bus ${busForm.busNumber} created for ${college?.name || 'College'}`);
      setIsCreateBusOpen(false);
      setBusForm({ busNumber: '', vehicleNumber: '', capacity: 40 });
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
        <main className="flex-1 p-4 md:p-8">
          {/* Top Bar Navigation */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/super-admin/colleges"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Colleges Directory
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 space-y-4">
              <div className="h-8 w-1/3 bg-slate-200 rounded animate-pulse" />
              <div className="h-24 w-full bg-slate-200 rounded-2xl animate-pulse" />
              <div className="h-64 w-full bg-slate-200 rounded-2xl animate-pulse" />
            </div>
          ) : !college ? (
            <EmptyState
              title="College Not Found"
              description="The requested college profile could not be retrieved."
              actionLabel="Return to Directory"
              onAction={() => (window.location.href = '/super-admin/colleges')}
            />
          ) : (
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0 text-2xl font-bold">
                    🏫
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-2xl font-extrabold text-slate-900">{college.name}</h1>
                      <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        {college.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-4">
                      {college.address && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {college.address}
                        </span>
                      )}
                      {college.contactPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {college.contactPhone}
                        </span>
                      )}
                      {college.contactEmail && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {college.contactEmail}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                      college.status === Status.ACTIVE
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                  >
                    {college.status === Status.ACTIVE ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {college.status}
                  </span>

                  <button
                    onClick={() => setIsEditCollegeOpen(true)}
                    className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 transition-all"
                    title="Edit College Profile"
                  >
                    <Edit3 className="h-4 w-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => setIsCreateBusOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Add Bus
                  </button>
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  onClick={() => setActiveTab('buses')}
                  className={`flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border transition-all cursor-pointer ${
                    activeTab === 'buses' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <BusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Fleet Buses</p>
                    <p className="text-2xl font-black text-slate-900">{metrics?.totalBuses ?? buses.length}</p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('routes')}
                  className={`flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border transition-all cursor-pointer ${
                    activeTab === 'routes' ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <RouteIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Transport Routes</p>
                    <p className="text-2xl font-black text-slate-900">{metrics?.totalRoutes ?? routes.length}</p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('drivers')}
                  className={`flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border transition-all cursor-pointer ${
                    activeTab === 'drivers' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Fleet Drivers</p>
                    <p className="text-2xl font-black text-slate-900">{drivers.length}</p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('students')}
                  className={`flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border transition-all cursor-pointer ${
                    activeTab === 'students' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Registered Students</p>
                    <p className="text-2xl font-black text-slate-900">{metrics?.totalStudents ?? students.length}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs & Search Controls */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  {/* Tab Navigation buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => { setActiveTab('buses'); setSearchTerm(''); }}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'buses'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <BusIcon className="h-3.5 w-3.5" />
                      Fleet Buses ({buses.length})
                    </button>

                    <button
                      onClick={() => { setActiveTab('routes'); setSearchTerm(''); }}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'routes'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <RouteIcon className="h-3.5 w-3.5" />
                      Routes & Stops ({routes.length})
                    </button>

                    <button
                      onClick={() => { setActiveTab('drivers'); setSearchTerm(''); }}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'drivers'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <User className="h-3.5 w-3.5" />
                      Drivers ({drivers.length})
                    </button>

                    <button
                      onClick={() => { setActiveTab('students'); setSearchTerm(''); }}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'students'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      Students ({students.length})
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={`Search ${activeTab}...`}
                      className="w-full rounded-xl border border-slate-200 py-1.5 pl-9 pr-4 text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                </div>

                {/* TAB 1: BUSES TABLE */}
                {activeTab === 'buses' && (
                  <div>
                    {filteredBuses.length === 0 ? (
                      <EmptyState
                        title="No Buses Found"
                        description={`No transport buses matched your criteria for ${college.name}.`}
                        actionLabel="Add Bus"
                        onAction={() => setIsCreateBusOpen(true)}
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
                                <td className="px-4 py-3.5 font-bold text-slate-900">{b.busNumber}</td>
                                <td className="px-4 py-3.5 font-mono text-xs text-blue-600 font-bold">{b.vehicleNumber}</td>
                                <td className="px-4 py-3.5 text-slate-600">{b.capacity} Seats</td>
                                <td className="px-4 py-3.5 font-semibold text-slate-800">
                                  {b.driver ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full text-xs">
                                      👤 {b.driver.name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs font-medium">Unassigned</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 font-semibold text-slate-800">
                                  {b.assignedRoute ? (
                                    <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full text-xs">
                                      🛣️ {b.assignedRoute.name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs font-medium">Unassigned</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setSelectedBus(b);
                                      setSelectedDriverId(b.driverId || drivers[0]?.id || '');
                                      setIsAssignDriverOpen(true);
                                    }}
                                    className="rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer active:scale-95 transition-all"
                                  >
                                    Assign Driver
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedBus(b);
                                      setSelectedRouteId(b.assignedRoute?.id || routes[0]?.id || '');
                                      setIsAssignRouteOpen(true);
                                    }}
                                    className="rounded-lg bg-blue-50 border border-blue-200/80 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer active:scale-95 transition-all"
                                  >
                                    Assign Route
                                  </button>

                                  <button
                                    onClick={() => setDeleteConfirmBus({ id: b.id, busNumber: b.busNumber })}
                                    className="rounded-lg bg-red-50 border border-red-200/80 p-1.5 text-red-600 hover:bg-red-100 cursor-pointer active:scale-95 transition-all inline-flex items-center justify-center align-middle"
                                    title="Delete bus"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
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
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-3.5">Route Name</th>
                              <th className="px-4 py-3.5">Description</th>
                              <th className="px-4 py-3.5">Stops Count</th>
                              <th className="px-4 py-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredRoutes.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3.5 font-bold text-slate-900">{r.name}</td>
                                <td className="px-4 py-3.5 text-xs text-slate-500">{r.description || 'N/A'}</td>
                                <td className="px-4 py-3.5">
                                  <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full text-xs">
                                    📍 {r.stops?.length || 0} Stops
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                      r.status === Status.ACTIVE
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                        : 'bg-red-50 text-red-700 border border-red-200/60'
                                    }`}
                                  >
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-3.5">Driver Name</th>
                              <th className="px-4 py-3.5">Phone</th>
                              <th className="px-4 py-3.5">License Number</th>
                              <th className="px-4 py-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredDrivers.map((d) => (
                              <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3.5 font-bold text-slate-900">{d.name}</td>
                                <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{d.phone}</td>
                                <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{d.licenseNumber || 'N/A'}</td>
                                <td className="px-4 py-3.5">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                      d.status === Status.ACTIVE
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                        : 'bg-red-50 text-red-700 border border-red-200/60'
                                    }`}
                                  >
                                    {d.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-3.5">Student Name</th>
                              <th className="px-4 py-3.5">Roll Number</th>
                              <th className="px-4 py-3.5">Class & Section</th>
                              <th className="px-4 py-3.5">Assigned Bus</th>
                              <th className="px-4 py-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3.5 font-bold text-slate-900">{s.name}</td>
                                <td className="px-4 py-3.5 font-mono text-xs text-blue-600 font-bold">{s.rollNumber || 'N/A'}</td>
                                <td className="px-4 py-3.5 text-xs text-slate-600">
                                  {s.className ? `${s.className} ${s.section ? `(${s.section})` : ''}` : 'N/A'}
                                </td>
                                <td className="px-4 py-3.5 font-semibold text-slate-800">
                                  {s.assignedBus ? (
                                    <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full text-xs">
                                      🚌 {s.assignedBus.busNumber}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs font-medium">Unassigned</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                      s.status === Status.ACTIVE
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                        : 'bg-red-50 text-red-700 border border-red-200/60'
                                    }`}
                                  >
                                    {s.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit College Details Modal */}
          {isEditCollegeOpen && college && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Edit College Profile</h3>
                  <button onClick={() => setIsEditCollegeOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleEditCollege} className="mt-4 space-y-3">
                  <div>
                    <Label required className="mb-1">College Name</Label>
                    <input
                      type="text"
                      required
                      value={editCollegeForm.name}
                      onChange={(e) => setEditCollegeForm({ ...editCollegeForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div>
                    <Label required className="mb-1">College Code</Label>
                    <input
                      type="text"
                      required
                      value={editCollegeForm.code}
                      onChange={(e) => setEditCollegeForm({ ...editCollegeForm, code: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div>
                    <Label className="mb-1">Campus Address</Label>
                    <input
                      type="text"
                      value={editCollegeForm.address}
                      onChange={(e) => setEditCollegeForm({ ...editCollegeForm, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div>
                    <Label className="mb-1">Contact Phone</Label>
                    <input
                      type="text"
                      value={editCollegeForm.contactPhone}
                      onChange={(e) => setEditCollegeForm({ ...editCollegeForm, contactPhone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div>
                    <Label className="mb-1">Contact Email</Label>
                    <input
                      type="email"
                      value={editCollegeForm.contactEmail}
                      onChange={(e) => setEditCollegeForm({ ...editCollegeForm, contactEmail: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div>
                    <Label className="mb-1">Institution Status</Label>
                    <Select
                      value={editCollegeForm.status}
                      onValueChange={(val: Status) => setEditCollegeForm({ ...editCollegeForm, status: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Status.ACTIVE}>ACTIVE</SelectItem>
                        <SelectItem value={Status.INACTIVE}>INACTIVE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsEditCollegeOpen(false)}
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
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Create Bus Modal */}
          {isCreateBusOpen && college && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Add Bus to {college.name}</h3>
                  <button onClick={() => setIsCreateBusOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateBus} className="mt-4 space-y-3">
                  <div>
                    <Label required className="mb-1">Bus Identifier Number</Label>
                    <input
                      type="text"
                      required
                      value={busForm.busNumber}
                      onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                      placeholder="BUS-101"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div>
                    <Label required className="mb-1">Vehicle License Plate</Label>
                    <input
                      type="text"
                      required
                      value={busForm.vehicleNumber}
                      onChange={(e) => setBusForm({ ...busForm, vehicleNumber: e.target.value })}
                      placeholder="BA 3 KHA 5678"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div>
                    <Label required className="mb-1">Seating Capacity</Label>
                    <input
                      type="number"
                      value={busForm.capacity}
                      onChange={(e) => setBusForm({ ...busForm, capacity: Number(e.target.value) })}
                      placeholder="40"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsCreateBusOpen(false)}
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
                        'Add Bus'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assign Driver Modal */}
          {isAssignDriverOpen && selectedBus && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Assign Driver to {selectedBus.busNumber}</h3>
                  <button onClick={() => setIsAssignDriverOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAssignDriverSubmit} className="mt-4 space-y-4">
                  <div>
                    <Label required className="mb-1.5">Select Driver</Label>
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver..." />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.length === 0 ? (
                          <SelectItem value="none" disabled>No drivers available for this college</SelectItem>
                        ) : (
                          drivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} ({d.phone})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

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
                      disabled={isSubmitting || !selectedDriverId || selectedDriverId === 'none'}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        'Assign Driver'
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
                  <h3 className="text-lg font-bold text-slate-900">Assign Route to {selectedBus.busNumber}</h3>
                  <button onClick={() => setIsAssignRouteOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAssignRouteSubmit} className="mt-4 space-y-4">
                  <div>
                    <Label required className="mb-1.5">Select Route</Label>
                    <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select route..." />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.length === 0 ? (
                          <SelectItem value="none" disabled>No routes available for this college</SelectItem>
                        ) : (
                          routes.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name} ({r.stops?.length || 0} Stops)
                            </SelectItem>
                          ))
                        )}
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
                      disabled={isSubmitting || !selectedRouteId || selectedRouteId === 'none'}
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

          {/* Delete Bus Confirmation Dialog */}
          <ConfirmDialog
            isOpen={!!deleteConfirmBus}
            onClose={() => setDeleteConfirmBus(null)}
            onConfirm={confirmDeleteBus}
            title="Delete Fleet Bus"
            description={`Are you sure you want to delete bus "${deleteConfirmBus?.busNumber}"? This action cannot be undone and will remove all associated driver assignments and route tracking configuration.`}
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
