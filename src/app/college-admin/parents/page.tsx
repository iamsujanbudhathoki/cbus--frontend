'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ParentFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Parent, Student } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/shared/page-header';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { Button } from '@/components/ui/button';
import { MultiSelectOption } from '@/components/ui/multi-select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ParentTable } from '@/components/parents/ParentTable';
import { ParentFormDialog } from '@/components/parents/ParentFormDialog';
import { ParentLinkChildDialog } from '@/components/parents/ParentLinkChildDialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ParentsPage() {
  const { user } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Parent Modal State
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  // Quick Link Modal State
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedParentForLink, setSelectedParentForLink] = useState<Parent | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [relationship, setRelationship] = useState('Father');
  const [linkErrorMsg, setLinkErrorMsg] = useState<string | null>(null);

  // Delete Confirmation Dialog State
  const [deleteParentId, setDeleteParentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setIsParentModalOpen(true);
  };

  const handleOpenEditModal = (parent: Parent) => {
    setEditingParent(parent);
    setIsParentModalOpen(true);
  };

  const handleSaveParent = async (data: ParentFormData) => {
    if (!user?.collegeId) return;
    setIsSubmitting(true);

    try {
      if (editingParent) {
        await api.updateParent(editingParent.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password || undefined,
          studentIds: data.studentIds,
        });
        toast.success(`Parent details updated for ${data.name}`);
      } else {
        await api.createParent({
          collegeId: user.collegeId,
          ...data,
        });
        toast.success(`Parent account created for ${data.name}`);
      }

      setIsParentModalOpen(false);
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
    if (!selectedParentForLink) return;
    setIsSubmitting(true);
    setLinkErrorMsg(null);

    try {
      await api.linkParentStudent({
        parentId: selectedParentForLink.id,
        studentIds: selectedStudentIds,
        relationship,
      });
      toast.success(`Children updated successfully for ${selectedParentForLink.name}`);
      setIsLinkOpen(false);
      fetchData();
    } catch (e: any) {
      const msg = e.message || 'Failed to link student(s)';
      setLinkErrorMsg(msg);
      toast.error(msg);
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
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <PageHeader
            title="Parent Directory"
            description="Manage parent accounts and associated children"
            action={
              <Button onClick={handleOpenCreateModal} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Parent
              </Button>
            }
          />

          <TableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by parent name, phone or email..."
          />

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <ParentTable
              parents={filteredParents}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onEdit={handleOpenEditModal}
              onLinkChild={(p) => {
                setSelectedParentForLink(p);
                const currentChildIds = p.students
                  ? p.students.map((s) => s.id)
                  : p.children
                  ? p.children.map((c) => c.id)
                  : [];
                setSelectedStudentIds(currentChildIds);
                setLinkErrorMsg(null);
                setIsLinkOpen(true);
              }}
              onDelete={(id) => setDeleteParentId(id)}
              onAddParent={handleOpenCreateModal}
            />
          </div>

          <ParentFormDialog
            isOpen={isParentModalOpen}
            onClose={() => setIsParentModalOpen(false)}
            editingParent={editingParent}
            studentOptions={studentOptions}
            onSubmit={handleSaveParent}
            isSubmitting={isSubmitting}
          />

          <ParentLinkChildDialog
            isOpen={isLinkOpen}
            onClose={() => {
              setIsLinkOpen(false);
              setLinkErrorMsg(null);
            }}
            selectedParentForLink={selectedParentForLink}
            selectedStudentIds={selectedStudentIds}
            setSelectedStudentIds={setSelectedStudentIds}
            relationship={relationship}
            setRelationship={setRelationship}
            students={students}
            onSubmit={handleLinkStudentSubmit}
            isSubmitting={isSubmitting}
            isLoadingStudents={isLoading}
            errorMsg={linkErrorMsg}
          />

          <ConfirmDialog
            isOpen={!!deleteParentId}
            onClose={() => setDeleteParentId(null)}
            onConfirm={handleDeleteParentConfirm}
            title="Delete Parent Account"
            description="Are you sure you want to delete this parent account?"
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
