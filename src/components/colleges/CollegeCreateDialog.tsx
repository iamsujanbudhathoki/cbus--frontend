import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collegeSchema, CollegeFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface CollegeCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CollegeFormData) => Promise<void>;
  isSubmitting: boolean;
  formError: string;
}

export function CollegeCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  formError,
}: CollegeCreateDialogProps) {
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

  const handleFormSubmit = async (data: CollegeFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register New College</DialogTitle>
          <DialogDescription>
            Setup institution profile and initial administrator account.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label required>College Name</Label>
              <Input
                type="text"
                {...register('name')}
                placeholder="Tribhuvan Science College"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label required>Unique Code</Label>
              <Input
                type="text"
                {...register('code')}
                placeholder="TSC01"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Input
              type="text"
              {...register('address')}
              placeholder="Kirtipur, Kathmandu, Nepal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Contact Phone</Label>
              <Input
                type="text"
                {...register('contactPhone')}
                placeholder="+977 1-4330430"
              />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input
                type="email"
                {...register('contactEmail')}
                placeholder="info@tribhuvan.edu.np"
              />
              {errors.contactEmail && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.contactEmail.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-md bg-slate-50 p-3 border border-slate-200 space-y-2">
            <p className="text-xs font-bold text-slate-800">Primary Administrator Credentials</p>
            <div>
              <Label required>Admin Full Name</Label>
              <Input
                type="text"
                {...register('adminName')}
                placeholder="Prof. Ramesh Sharma"
              />
              {errors.adminName && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.adminName.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label required>Admin Email</Label>
                <Input
                  type="email"
                  {...register('adminEmail')}
                  placeholder="admin@tribhuvan.edu.np"
                />
                {errors.adminEmail && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.adminEmail.message}</p>
                )}
              </div>
              <div>
                <Label required>Admin Password</Label>
                <Input
                  type="password"
                  {...register('adminPassword')}
                  placeholder="••••••••"
                />
                {errors.adminPassword && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.adminPassword.message}</p>
                )}
              </div>
            </div>
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
              Create College
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
