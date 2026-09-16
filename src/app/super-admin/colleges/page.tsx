'use client';

import React, { useEffect, useState } from 'react';
import { CollegeFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { College } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/shared/page-header';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { Button } from '@/components/ui/button';
import { CollegeTable } from '@/components/colleges/CollegeTable';
import { CollegeCreateDialog } from '@/components/colleges/CollegeCreateDialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchColleges = async () => {
    setIsLoading(true);
    try {
      const data = await api.getColleges();
      setColleges(data);
    } catch (err: any) {
      toast.error('Failed to load college list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleCreateCollege = async (data: CollegeFormData) => {
    setFormError('');
    setIsSubmitting(true);

    try {
      await api.createCollege(data);
      toast.success(`College "${data.name}" registered successfully`);
      setIsModalOpen(false);
      fetchColleges();
    } catch (err: any) {
      const msg = err.message || 'Failed to create college';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredColleges = colleges.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <PageHeader
            title="College Management"
            description="Register and manage educational institutions"
            action={
              <Button
                onClick={() => {
                  setFormError('');
                  setIsModalOpen(true);
                }}
                size="sm"
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add College
              </Button>
            }
          />

          <TableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by college name or code..."
          />

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <CollegeTable
              colleges={filteredColleges}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onAddCollege={() => {
                setFormError('');
                setIsModalOpen(true);
              }}
            />
          </div>

          <CollegeCreateDialog
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleCreateCollege}
            isSubmitting={isSubmitting}
            formError={formError}
          />
        </main>
      </div>
    </div>
  );
}
