'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parentSchema, ParentFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Parent, Student } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import { Label } from '@/components/ui/label';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, X, Loader2, Edit, Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function ParentsPage() {
  const { user } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Parent Modal State (Create / Edit)
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  // Quick Link Modal State
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedParentForLink, setSelectedParentForLink] = useState<Parent | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [relationship, setRelationship] = useState('Father');

  // Delete Confirmation Dialog State
  const [deleteParentId, setDeleteParentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParentFormData>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: 'password123',
      studentIds: [],
    },
  });

  const selectedStudentIds = watch('studentIds') || [];

  const fetchData = async () => {
    if (!user?.collegeId) return;
    setIsLoading(true);
    try {
      const [pData, sData] = await Promise.all([
        api.getParents(user.collegeId),
        api.getStudents(user.collegeId),
      ]);
      setParents(pData);
      setStudents(sData);
    } catch (e: any) {
      toast.error('Failed to load parent records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Convert students to options format for MultiSelect
  const studentOptions: MultiSelectOption[] = useMemo(() => {
    return students.map((st) => ({
      value: st.id,
      label: st.name,
      description: `Class: ${st.className || 'N/A'} • ${st.assignedBus?.busNumber ? `Bus: ${st.assignedBus.busNumber}` : 'No Bus'}`,
      badge: st.rollNumber ? `Roll: ${st.rollNumber}` : undefined,
    }));
  }, [students]);

  const handleOpenCreateModal = () => {
    setEditingParent(null);
    reset({
      name: '',
      email: '',
      phone: '',
      password: 'password123',
      studentIds: [],
    });
    setIsParentModalOpen(true);
  };

  const handleOpenEditModal = (parent: Parent) => {
    setEditingParent(parent);
    const existingStudentIds = parent.students ? parent.students.map((st) => st.id) : [];
    reset({
      name: parent.name,
      email: parent.email || '',
      phone: parent.phone || '',
      password: '', // optional on edit
      studentIds: existingStudentIds,
    });
    setIsParentModalOpen(true);
  };

  const handleSaveParent = async (data: ParentFormData) => {
    if (!user?.collegeId) return;
    setIsSubmitting(true);

    try {
      if (editingParent) {
        // Update parent
        await api.updateParent(editingParent.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password || undefined,
          studentIds: data.studentIds,
        });
        toast.success(`Parent details updated for ${data.name}`);
      } else {
        // Create parent
        await api.createParent({
          collegeId: user.collegeId,
          ...data,
        });
        toast.success(`Parent account created for ${data.name}`);
      }

      setIsParentModalOpen(false);
      reset();
      fetchData();
    } catch (e: any) {
      toast.error(e.message || `Failed to ${editingParent ? 'update' : 'create'} parent account`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteParentConfirm = async () => {
    if (!deleteParentId) return;
    setIsDeleting(true);
    try {
      await api.deleteParent(deleteParentId);
      toast.success('Parent account removed successfully');
      setDeleteParentId(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete parent account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLinkStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentForLink || !selectedStudentId) return;
    setIsSubmitting(true);

    try {
      await api.linkParentStudent({
        parentId: selectedParentForLink.id,
        studentId: selectedStudentId,
        relationship,
      });
      toast.success(`Child linked successfully to ${selectedParentForLink.name}`);
      setIsLinkOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to link student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredParents = parents.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone && p.phone.includes(searchTerm)) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Parent Directory</h1>
              <p className="text-sm text-slate-500">Manage parent accounts and associated children</p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Parent Account
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by parent name, phone or email..."
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
            ) : filteredParents.length === 0 ? (
              <EmptyState
                title="No Parent Accounts Found"
                description={
                  searchTerm
                    ? `No parents matching "${searchTerm}". Try a different search term.`
                    : 'No parent accounts created yet for this college.'
                }
                actionLabel={searchTerm ? undefined : 'Add First Parent'}
                onAction={searchTerm ? undefined : handleOpenCreateModal}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5">Parent Name</th>
                      <th className="px-4 py-3.5">Phone</th>
                      <th className="px-4 py-3.5">Email Login</th>
                      <th className="px-4 py-3.5">Associated Children</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParents.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{p.name}</td>
                        <td className="px-4 py-3.5 text-slate-700">{p.phone || '-'}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-600 font-semibold">{p.email || '-'}</td>
                        <td className="px-4 py-3.5">
                          {p.students && p.students.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {p.students.map((st) => (
                                <span
                                  key={st.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/70 px-2.5 py-1 text-xs font-semibold text-blue-800"
                                >
                                  👦 {st.name} {st.rollNumber ? `(${st.rollNumber})` : ''}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No children linked</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer active:scale-95 transition-all"
                              title="Edit Parent Account & Assigned Children"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedParentForLink(p);
                                setSelectedStudentId(students[0]?.id || '');
                                setIsLinkOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer active:scale-95 transition-all"
                              title="Link additional child"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              + Link Child
                            </button>

                            <button
                              onClick={() => setDeleteParentId(p.id)}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 cursor-pointer active:scale-95 transition-all"
                              title="Delete Parent Account"
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

          {/* Add / Edit Parent Modal */}
          {isParentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingParent ? 'Edit Parent Account' : 'Add Parent Account'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {editingParent
                        ? 'Update parent details and manage assigned children'
                        : 'Create a new parent account and assign children'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsParentModalOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleSaveParent)} className="mt-4 space-y-4">
                  <div>
                    <Label required className="mb-1 text-xs font-semibold">
                      Parent Full Name
                    </Label>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Hari Prasad Sharma"
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
                      <Label className="mb-1 text-xs font-semibold">Phone Number</Label>
                      <input
                        type="text"
                        {...register('phone')}
                        placeholder="+977 9851098765"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <Label required className="mb-1 text-xs font-semibold">
                        Email Address (Login)
                      </Label>
                      <input
                        type="email"
                        {...register('email')}
                        placeholder="parent@gmail.com"
                        className={`w-full rounded-lg border p-2 text-xs focus:outline-none transition-all ${
                          errors.email
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs font-medium text-red-500">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label required={!editingParent} className="mb-1 text-xs font-semibold">
                      {editingParent ? 'Password (Leave blank to keep existing)' : 'Password'}
                    </Label>
                    <input
                      type="password"
                      {...register('password')}
                      placeholder={editingParent ? '••••••••' : 'Minimum 6 characters'}
                      className={`w-full rounded-lg border p-2 text-xs focus:outline-none transition-all ${
                        errors.password
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                      }`}
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs font-medium text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Reusable Compact MultiSelect Component for Children */}
                  <div>
                    <Label className="mb-1 text-xs font-semibold flex items-center justify-between">
                      <span>Children (Students)</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {selectedStudentIds.length} selected
                      </span>
                    </Label>
                    <MultiSelect
                      options={studentOptions}
                      selected={selectedStudentIds}
                      onChange={(val) => setValue('studentIds', val, { shouldValidate: true })}
                      placeholder="Select children for this parent..."
                      searchPlaceholder="Search student by name, roll, class..."
                      emptyText="No students found matching search."
                      error={!!errors.studentIds}
                    />
                    {errors.studentIds && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        {errors.studentIds.message}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Search and select one or multiple children to associate with this parent.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsParentModalOpen(false)}
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
                      ) : editingParent ? (
                        'Save Changes'
                      ) : (
                        'Create Parent'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Link Student Quick Modal */}
          {isLinkOpen && selectedParentForLink && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Link Child to {selectedParentForLink.name}
                  </h3>
                  <button
                    onClick={() => setIsLinkOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleLinkStudentSubmit} className="mt-4 space-y-4">
                  <div>
                    <Label required className="mb-1.5 text-xs font-semibold">
                      Select Student
                    </Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select student..." />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.name} ({s.rollNumber || 'No Roll'}) - Class: {s.className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label required className="mb-1.5 text-xs font-semibold">
                      Relationship
                    </Label>
                    <Select value={relationship} onValueChange={setRelationship}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select relationship..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Father" className="text-xs">Father</SelectItem>
                        <SelectItem value="Mother" className="text-xs">Mother</SelectItem>
                        <SelectItem value="Guardian" className="text-xs">Guardian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsLinkOpen(false)}
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
                          Linking...
                        </>
                      ) : (
                        'Link Child'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Destructive Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={!!deleteParentId}
            onClose={() => setDeleteParentId(null)}
            onConfirm={handleDeleteParentConfirm}
            title="Delete Parent Account"
            description="Are you sure you want to delete this parent account? This action will deactivate the parent account and remove student link references."
            confirmLabel="Delete Account"
            cancelLabel="Cancel"
            variant="destructive"
            isLoading={isDeleting}
          />
        </main>
      </div>
    </div>
  );
}
