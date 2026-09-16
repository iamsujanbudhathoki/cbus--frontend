import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parentSchema, ParentFormData } from '@/lib/validations';
import { Parent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ParentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingParent: Parent | null;
  studentOptions: MultiSelectOption[];
  onSubmit: (data: ParentFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function ParentFormDialog({
  isOpen,
  onClose,
  editingParent,
  studentOptions,
  onSubmit,
  isSubmitting,
}: ParentFormDialogProps) {
  const existingStudentIds = editingParent?.students ? editingParent.students.map((st) => st.id) : [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParentFormData>({
    resolver: zodResolver(parentSchema),
    values: {
      name: editingParent ? editingParent.name : '',
      email: editingParent ? editingParent.email || '' : '',
      phone: editingParent ? editingParent.phone || '' : '',
      password: editingParent ? '' : 'password123',
      studentIds: existingStudentIds,
    },
  });

  const selectedStudentIds = watch('studentIds') || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingParent ? 'Edit Parent Account' : 'Add Parent Account'}
          </DialogTitle>
          <DialogDescription>
            {editingParent
              ? 'Update parent details and manage assigned children.'
              : 'Create a new parent account and assign children.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label required>Parent Full Name</Label>
            <Input
              type="text"
              {...register('name')}
              placeholder="Hari Prasad Sharma"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Phone Number</Label>
              <Input
                type="text"
                {...register('phone')}
                placeholder="+977 9851098765"
              />
            </div>
            <div>
              <Label required>Email Address (Login)</Label>
              <Input
                type="email"
                {...register('email')}
                placeholder="parent@gmail.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label required={!editingParent}>
              {editingParent ? 'Password (Optional on edit)' : 'Password'}
            </Label>
            <Input
              type="password"
              {...register('password')}
              placeholder={editingParent ? '••••••••' : 'Minimum 6 characters'}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <Label className="flex items-center justify-between mb-1">
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
              searchPlaceholder="Search student by name, roll..."
              emptyText="No students found."
              error={!!errors.studentIds}
            />
            {errors.studentIds && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.studentIds.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              {editingParent ? 'Save Changes' : 'Create Parent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
