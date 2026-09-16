import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routeSchema, RouteFormData } from '@/lib/validations';
import { Route } from '@/lib/types';
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
import { Flag, Navigation, Plus, ArrowUp, ArrowDown, Trash2, Loader2 } from 'lucide-react';

interface RouteFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingRoute: Route | null;
  onSubmit: (data: RouteFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function RouteFormDialog({
  isOpen,
  onClose,
  editingRoute,
  onSubmit,
  isSubmitting,
}: RouteFormDialogProps) {
  let defaultStart = '';
  let defaultEnd = '';
  let defaultStops: any[] = [
    { name: 'Start Pickup Point', latitude: 27.6915, longitude: 85.342, estimatedTime: '07:00 AM' },
    { name: 'Final Destination Stop', latitude: 27.6800, longitude: 85.3100, estimatedTime: '07:45 AM' },
  ];

  if (editingRoute) {
    if (editingRoute.description && editingRoute.description.includes('From ') && editingRoute.description.includes(' to ')) {
      const parts = editingRoute.description.replace('From ', '').split(' to ');
      defaultStart = parts[0] || '';
      defaultEnd = parts[1] || '';
    } else {
      defaultStart = editingRoute.stops && editingRoute.stops.length > 0 ? editingRoute.stops[0].name : '';
      defaultEnd = editingRoute.stops && editingRoute.stops.length > 1 ? editingRoute.stops[editingRoute.stops.length - 1].name : '';
    }
    defaultStops = (editingRoute.stops || []).map((s) => ({
      name: s.name,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      estimatedTime: s.estimatedTime || '',
    }));
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    values: {
      name: editingRoute ? editingRoute.name : '',
      startLocation: defaultStart,
      endLocation: defaultEnd,
      stops: defaultStops,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'stops',
  });

  const handleAddStopWaypoint = () => {
    append({
      name: '',
      latitude: 27.6915,
      longitude: 85.342,
      estimatedTime: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editingRoute ? 'Edit Route' : 'Add Route'}
          </DialogTitle>
          <DialogDescription>
            Enter route details and add bus stops.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-blue-600" />
              1. Route Overview
            </h4>

            <div>
              <Label required>Route Name</Label>
              <Input
                type="text"
                {...register('name')}
                placeholder="Route 1: Baneshwor - Kirtipur Express"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>Start Location</Label>
                <Input
                  type="text"
                  {...register('startLocation')}
                  placeholder="Baneshwor"
                />
                {errors.startLocation && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.startLocation.message}</p>
                )}
              </div>

              <div>
                <Label required>End Location</Label>
                <Input
                  type="text"
                  {...register('endLocation')}
                  placeholder="Kirtipur"
                />
                {errors.endLocation && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.endLocation.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-blue-600" />
                2. Bus Stops ({fields.length})
              </h4>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStopWaypoint}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Bus Stop
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 p-3 text-center">
                <p className="text-xs text-slate-400">No bus stops added yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-md border border-slate-200 bg-white p-3 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                        {index + 1}
                      </span>

                      <div className="flex items-center gap-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => move(index, index - 1)}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {index < fields.length - 1 && (
                          <button
                            type="button"
                            onClick={() => move(index, index + 1)}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                          title="Remove Waypoint"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label required>Stop Name</Label>
                        <Input
                          type="text"
                          {...register(`stops.${index}.name` as const)}
                          placeholder="e.g. Maitighar Mandala Stop"
                        />
                      </div>

                      <div>
                        <Label>Est. Arrival Time</Label>
                        <Input
                          type="text"
                          {...register(`stops.${index}.estimatedTime` as const)}
                          placeholder="e.g. 07:15 AM"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label required>Latitude</Label>
                        <Input
                          type="number"
                          step="any"
                          {...register(`stops.${index}.latitude` as const, { valueAsNumber: true })}
                          placeholder="27.6915"
                        />
                      </div>
                      <div>
                        <Label required>Longitude</Label>
                        <Input
                          type="number"
                          step="any"
                          {...register(`stops.${index}.longitude` as const, { valueAsNumber: true })}
                          placeholder="85.3420"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
              {editingRoute ? 'Save Changes' : 'Create Route'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
