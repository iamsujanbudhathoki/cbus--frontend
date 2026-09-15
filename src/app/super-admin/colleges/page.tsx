'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collegeSchema, CollegeFormData } from '@/lib/validations';
import { api } from '@/lib/api';
import { College, Status } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import EmptyState from '@/components/shared/empty-state';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Plus, School, CheckCircle, XCircle, Search, X, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollegeFormData>({
    resolver: zodResolver(collegeSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      contactPhone: '',
      contactEmail: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    },
  });

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
      toast.success(`College "${data.name}" registered successfully!`);
      setIsModalOpen(false);
      reset();
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
        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">College Management</h1>
              <p className="text-sm text-slate-500">Register and manage educational institutions</p>
            </div>

            <button
              onClick={() => {
                reset();
                setFormError('');
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add New College
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by college name or code..."
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
            ) : filteredColleges.length === 0 ? (
              <EmptyState
                title="No Colleges Found"
                description={
                  searchTerm
                    ? `No colleges matching "${searchTerm}". Try a different search term.`
                    : 'No educational institutions registered yet.'
                }
                actionLabel={searchTerm ? undefined : 'Add First College'}
                onAction={searchTerm ? undefined : () => {
                  reset();
                  setFormError('');
                  setIsModalOpen(true);
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5">College Name</th>
                      <th className="px-4 py-3.5">Code</th>
                      <th className="px-4 py-3.5">Address</th>
                      <th className="px-4 py-3.5">Phone</th>
                      <th className="px-4 py-3.5">Email</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredColleges.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          <Link 
                            href={`/super-admin/colleges/${c.id}`} 
                            className="hover:text-blue-600 hover:underline transition-colors flex items-center gap-2"
                          >
                            <School className="h-4 w-4 text-blue-600/70 shrink-0" />
                            {c.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-600 font-bold">{c.code}</td>
                        <td className="px-4 py-3.5 text-slate-600">{c.address || '-'}</td>
                        <td className="px-4 py-3.5 text-slate-600">{c.contactPhone || '-'}</td>
                        <td className="px-4 py-3.5 text-slate-600">{c.contactEmail || '-'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            c.status === Status.ACTIVE ? 'bg-emerald-50 border border-emerald-200/60 text-emerald-700' : 'bg-red-50 border border-red-200/60 text-red-700'
                          }`}>
                            {c.status === Status.ACTIVE ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/super-admin/colleges/${c.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-xs"
                          >
                            View Details
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create College Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Register New College</h3>
                  <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {formError && (
                  <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-600 border border-red-200 text-center">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSubmit(handleCreateCollege)} className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label required className="mb-1">College Name</Label>
                      <input
                        type="text"
                        {...register('name')}
                        placeholder="Tribhuvan Science College"
                        className={`w-full rounded-xl border p-2.5 text-sm focus:outline-none transition-all ${
                          errors.name
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs font-medium text-red-500">{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label required className="mb-1">Unique Code</Label>
                      <input
                        type="text"
                        {...register('code')}
                        placeholder="TSC01"
                        className={`w-full rounded-xl border p-2.5 text-sm focus:outline-none transition-all ${
                          errors.code
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                      />
                      {errors.code && (
                        <p className="mt-1 text-xs font-medium text-red-500">{errors.code.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1">Address</Label>
                    <input
                      type="text"
                      {...register('address')}
                      placeholder="Kirtipur, Kathmandu, Nepal"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1">Contact Phone</Label>
                      <input
                        type="text"
                        {...register('contactPhone')}
                        placeholder="+977 1-4330430"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <Label className="mb-1">Contact Email</Label>
                      <input
                        type="email"
                        {...register('contactEmail')}
                        placeholder="info@tribhuvan.edu.np"
                        className={`w-full rounded-xl border p-2.5 text-sm focus:outline-none transition-all ${
                          errors.contactEmail
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                      />
                      {errors.contactEmail && (
                        <p className="mt-1 text-xs font-medium text-red-500">{errors.contactEmail.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-100 space-y-2.5">
                    <p className="text-xs font-bold text-blue-900">Primary College Administrator Account</p>
                    <div>
                      <Label required className="mb-1 text-blue-900">Admin Full Name</Label>
                      <input
                        type="text"
                        {...register('adminName')}
                        placeholder="Prof. Ramesh Sharma"
                        className={`w-full rounded-lg border bg-white p-2 text-xs focus:outline-none transition-all ${
                          errors.adminName
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-slate-300 focus:border-blue-600'
                        }`}
                      />
                      {errors.adminName && (
                        <p className="mt-1 text-xs font-medium text-red-500">{errors.adminName.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label required className="mb-1 text-blue-900">Admin Email</Label>
                        <input
                          type="email"
                          {...register('adminEmail')}
                          placeholder="admin@tribhuvan.edu.np"
                          className={`w-full rounded-lg border bg-white p-2 text-xs focus:outline-none transition-all ${
                            errors.adminEmail
                              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                              : 'border-slate-300 focus:border-blue-600'
                          }`}
                        />
                        {errors.adminEmail && (
                          <p className="mt-1 text-xs font-medium text-red-500">{errors.adminEmail.message}</p>
                        )}
                      </div>
                      <div>
                        <Label required className="mb-1 text-blue-900">Admin Password</Label>
                        <input
                          type="password"
                          {...register('adminPassword')}
                          placeholder="••••••••"
                          className={`w-full rounded-lg border bg-white p-2 text-xs focus:outline-none transition-all ${
                            errors.adminPassword
                              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                              : 'border-slate-300 focus:border-blue-600'
                          }`}
                        />
                        {errors.adminPassword && (
                          <p className="mt-1 text-xs font-medium text-red-500">{errors.adminPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsModalOpen(false)}
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
                        'Create College'
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
