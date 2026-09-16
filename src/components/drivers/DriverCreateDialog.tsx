import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { driverSchema, DriverFormData } from '@/lib/validations';
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

interface DriverCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DriverFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function DriverCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: DriverCreateDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      phone: '',
      licenseNumber: '',
    },
  });

  const handleFormSubmit = async (data: DriverFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
          <DialogDescription>
            Enter driver credentials and license details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label required>Driver Full Name</Label>
            <Input
              type="text"
              {...register('name')}
              placeholder="Ramesh Bahadur Chhetri"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label required>Phone Number</Label>
              <Input
                type="text"
                {...register('phone')}
                placeholder="+977 9841234567"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone.message}</p>
              )}
            </div>
            <div>
              <Label required>License Number</Label>
              <Input
                type="text"
                {...register('licenseNumber')}
                placeholder="DL-NP-2022-9988"
              />
              {errors.licenseNumber && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.licenseNumber.message}</p>
              )}
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
              Create Driver
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
