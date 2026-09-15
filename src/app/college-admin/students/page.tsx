'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentSchema, StudentFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bus, Route, RouteStop, Student } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, GraduationCap, Bus as BusIcon, MapPin, Search, X, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignBusOpen, setIsAssignBusOpen] = useState(false);
  const [isAssignStopOpen, setIsAssignStopOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    rollNumber: '',
    className: '',
    section: '',
    contact: '',
    address: '',
  });

  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStopId, setSelectedStopId] = useState('');

  const fetchAllData = async () => {
    if (!user?.collegeId) return;
    setIsLoading(true);
    try {
      const [sData, bData, rData] = await Promise.all([
        api.getStudents(user.collegeId),
        api.getBuses(user.collegeId),
        api.getRoutes(user.collegeId),
      ]);
      setStudents(sData);
      setBuses(bData);
      setRoutes(rData);
    } catch (err: any) {
      toast.error('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.collegeId) return;
    setIsSubmitting(true);

    try {
      await api.createStudent({
        collegeId: user.collegeId,
        ...studentForm,
      });
      toast.success(`Student ${studentForm.name} created successfully!`);
      setIsCreateOpen(false);
      setStudentForm({ name: '', rollNumber: '', className: '', section: '', contact: '', address: '' });
      fetchAllData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !user?.collegeId) return;
    setIsSubmitting(true);

    try {
      await api.assignStudentBus({
        studentId: selectedStudent.id,
        busId: selectedBusId,
        collegeId: user.collegeId,
      });
      toast.success(`Bus assigned to ${selectedStudent.name}`);
      setIsAssignBusOpen(false);
      fetchAllData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to assign bus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignStopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !user?.collegeId) return;
    setIsSubmitting(true);

    try {
      await api.assignStudentStop({
        studentId: selectedStudent.id,
        stopId: selectedStopId,
        collegeId: user.collegeId,
      });
      toast.success(`Route stop assigned to ${selectedStudent.name}`);
      setIsAssignStopOpen(false);
      fetchAllData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to assign stop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedRouteObj = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Student Directory</h1>
              <p className="text-sm text-slate-500">Manage student records and transport assignments</p>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Student
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name or roll number..."
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
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                title="No Students Found"
                description={
                  searchTerm
                    ? `No students matching "${searchTerm}". Try a different search term.`
                    : 'No student records created yet for this college.'
                }
                actionLabel={searchTerm ? undefined : 'Add First Student'}
                onAction={searchTerm ? undefined : () => setIsCreateOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Roll No.</th>
                      <th className="px-4 py-3.5">Class / Sec</th>
                      <th className="px-4 py-3.5">Assigned Bus</th>
                      <th className="px-4 py-3.5">Pickup/Drop Stop</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{s.name}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-600 font-semibold">{s.rollNumber || '-'}</td>
                        <td className="px-4 py-3.5 text-slate-600">{s.className} {s.section ? `(${s.section})` : ''}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {s.assignedBus ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full text-xs">
                              🚌 {s.assignedBus.busNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          {s.assignedStop ? (
                            <span className="inline-flex items-center gap-1 text-blue-700 font-medium bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full text-xs">
                              📍 {s.assignedStop.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setSelectedBusId(s.assignedBus?.id || buses[0]?.id || '');
                              setIsAssignBusOpen(true);
                            }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer active:scale-95 transition-all"
                          >
                            Assign Bus
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              const assignedRouteId = s.assignedBus?.assignedRoute?.id || routes[0]?.id || '';
                              const targetRoute = routes.find((r) => r.id === assignedRouteId) || routes[0];
                              const initialStopId = targetRoute?.stops?.[0]?.id || '';
                              setSelectedRouteId(assignedRouteId);
                              setSelectedStopId(initialStopId);
                              setIsAssignStopOpen(true);
                            }}
                            className="rounded-lg bg-blue-50 border border-blue-200/80 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer active:scale-95 transition-all"
                          >
                            Assign Stop
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create Student Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Add New Student</h3>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateStudent} className="mt-4 space-y-3">
                  <div>
                    <Label required className="mb-1">Student Full Name</Label>
                    <input
                      type="text"
                      required
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      placeholder="Aarav Sharma"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1">Roll Number</Label>
                      <input
                        type="text"
                        value={studentForm.rollNumber}
                        onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                        placeholder="2026-CS-042"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <Label className="mb-1">Class / Program</Label>
                      <input
                        type="text"
                        value={studentForm.className}
                        onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                        placeholder="B.Sc CS"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1">Section</Label>
                      <input
                        type="text"
                        value={studentForm.section}
                        onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                        placeholder="A"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <Label className="mb-1">Contact Phone</Label>
                      <input
                        type="text"
                        value={studentForm.contact}
                        onChange={(e) => setStudentForm({ ...studentForm, contact: e.target.value })}
                        placeholder="+977 9801122334"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
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
                          Creating...
                        </>
                      ) : (
                        'Create Student'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assign Bus Modal */}
          {isAssignBusOpen && selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Assign Bus to {selectedStudent.name}</h3>
                  <button onClick={() => setIsAssignBusOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAssignBusSubmit} className="mt-4 space-y-4">
                  <div>
                    <Label required className="mb-1.5">Select Fleet Bus</Label>
                    <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bus..." />
                      </SelectTrigger>
                      <SelectContent>
                        {buses.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.busNumber} ({b.vehicleNumber}) - Route: {b.assignedRoute?.name || 'No Route'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsAssignBusOpen(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedBusId}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Bus Assignment'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assign Stop Modal */}
          {isAssignStopOpen && selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Assign Route Stop to {selectedStudent.name}</h3>
                  <button onClick={() => setIsAssignStopOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAssignStopSubmit} className="mt-4 space-y-4">
                  {selectedStudent.assignedBus ? (
                    <div className="rounded-xl bg-blue-50/80 p-3 border border-blue-100 text-xs">
                      <p className="font-bold text-blue-900 flex items-center gap-1.5">
                        <span>🚌</span>
                        Assigned Bus: {selectedStudent.assignedBus.busNumber} ({selectedStudent.assignedBus.vehicleNumber})
                      </p>
                      {selectedStudent.assignedBus.assignedRoute ? (
                        <p className="text-blue-700 mt-0.5 font-medium pl-5">
                          Bus Route: <strong>{selectedStudent.assignedBus.assignedRoute.name}</strong>
                        </p>
                      ) : (
                        <p className="text-amber-700 mt-0.5 font-medium pl-5 italic">
                          (Note: This bus has no route assigned yet)
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-200/70 text-xs text-amber-800 font-medium">
                      💡 Student has no assigned bus yet. Select a route and pickup/drop stop below.
                    </div>
                  )}

                  <div>
                    <Label required className="mb-1.5">Select Route</Label>
                    <Select
                      value={selectedRouteId}
                      onValueChange={(val) => {
                        setSelectedRouteId(val);
                        const r = routes.find((rt) => rt.id === val);
                        if (r && r.stops && r.stops.length > 0) {
                          setSelectedStopId(r.stops[0].id);
                        } else {
                          setSelectedStopId('');
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select route..." />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} ({r.stops?.length || 0} Stops)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label required className="mb-1.5">Select Pickup/Drop Stop</Label>
                    <Select value={selectedStopId} onValueChange={setSelectedStopId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pickup/drop stop..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(!selectedRouteObj?.stops || selectedRouteObj.stops.length === 0) ? (
                          <SelectItem value="none" disabled>
                            No stops configured for this route
                          </SelectItem>
                        ) : (
                          selectedRouteObj.stops.map((stop) => (
                            <SelectItem key={stop.id} value={stop.id}>
                              Stop {stop.sequence}: {stop.name} (Est: {stop.estimatedTime || 'N/A'})
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
                      onClick={() => setIsAssignStopOpen(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedStopId || selectedStopId === 'none'}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Stop Assignment'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
