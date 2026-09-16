import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { busSchema, BusFormData } from '@/lib/validations';
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

interface BusCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BusFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function BusCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: BusCreateDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      busNumber: '',
      registrationNumber: '',
      capacity: 40,
    },
  });

  const handleFormSubmit = async (data: BusFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bus</DialogTitle>
          <DialogDescription>
            Enter bus number, plate number, and total seats.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label required>Bus Name / Number</Label>
            <Input
              type="text"
              {...register('busNumber')}
              placeholder="BUS-101"
            />
            {errors.busNumber && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.busNumber.message}</p>
            )}
          </div>

          <div>
            <Label required>Bus Plate Number</Label>
            <Input
              type="text"
              {...register('registrationNumber')}
              placeholder="BA 3 KHA 5678"
            />
            {errors.registrationNumber && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.registrationNumber.message}</p>
            )}
          </div>

          <div>
            <Label required>Total Seats</Label>
            <Input
              type="number"
              {...register('capacity', { valueAsNumber: true })}
              placeholder="40"
            />
            {errors.capacity && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.capacity.message}</p>
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
              Create Bus
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
