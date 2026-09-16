'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bus, Route, Student } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/shared/page-header';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { Button } from '@/components/ui/button';
import { StudentTable } from '@/components/students/StudentTable';
import { StudentCreateDialog } from '@/components/students/StudentCreateDialog';
import { StudentAssignBusDialog } from '@/components/students/StudentAssignBusDialog';
import { StudentAssignStopDialog } from '@/components/students/StudentAssignStopDialog';
import { Plus } from 'lucide-react';
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

  const handleCreateStudent = async (studentForm: any) => {
    if (!user?.collegeId) return;
    setIsSubmitting(true);

    try {
      await api.createStudent({
        collegeId: user.collegeId,
        ...studentForm,
      });
      toast.success(`Student ${studentForm.name} created successfully`);
      setIsCreateOpen(false);
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <PageHeader
            title="Student Directory"
            description="Manage student records and transport assignments"
            action={
              <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Student
              </Button>
            }
          />

          <TableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by student name or roll number..."
          />

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <StudentTable
              students={filteredStudents}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onAssignBus={(s) => {
                setSelectedStudent(s);
                setSelectedBusId(s.assignedBus?.id || buses[0]?.id || '');
                setIsAssignBusOpen(true);
              }}
              onAssignStop={(s) => {
                setSelectedStudent(s);
                const assignedRouteId = s.assignedBus?.assignedRoute?.id || routes[0]?.id || '';
                const targetRoute = routes.find((r) => r.id === assignedRouteId) || routes[0];
                const initialStopId = targetRoute?.stops?.[0]?.id || '';
                setSelectedRouteId(assignedRouteId);
                setSelectedStopId(initialStopId);
                setIsAssignStopOpen(true);
              }}
              onAddStudent={() => setIsCreateOpen(true)}
            />
          </div>

          <StudentCreateDialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreateStudent}
            isSubmitting={isSubmitting}
          />

          <StudentAssignBusDialog
            isOpen={isAssignBusOpen}
            onClose={() => setIsAssignBusOpen(false)}
            selectedStudent={selectedStudent}
            selectedBusId={selectedBusId}
            setSelectedBusId={setSelectedBusId}
            buses={buses}
            onSubmit={handleAssignBusSubmit}
            isSubmitting={isSubmitting}
          />

          <StudentAssignStopDialog
            isOpen={isAssignStopOpen}
            onClose={() => setIsAssignStopOpen(false)}
            selectedStudent={selectedStudent}
            selectedRouteId={selectedRouteId}
            setSelectedRouteId={setSelectedRouteId}
            selectedStopId={selectedStopId}
            setSelectedStopId={setSelectedStopId}
            routes={routes}
            onSubmit={handleAssignStopSubmit}
            isSubmitting={isSubmitting}
          />
        </main>
      </div>
    </div>
  );
}
