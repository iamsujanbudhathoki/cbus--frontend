import React from 'react';
import { Route, Student } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface StudentAssignStopDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent: Student | null;
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;
  selectedStopId: string;
  setSelectedStopId: (id: string) => void;
  routes: Route[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function StudentAssignStopDialog({
  isOpen,
  onClose,
  selectedStudent,
  selectedRouteId,
  setSelectedRouteId,
  selectedStopId,
  setSelectedStopId,
  routes,
  onSubmit,
  isSubmitting,
}: StudentAssignStopDialogProps) {
  const selectedRouteObj = routes.find((r) => r.id === selectedRouteId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Route Stop to {selectedStudent?.name}</DialogTitle>
          <DialogDescription>
            Select pickup and drop-off waypoint stop.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {selectedStudent?.assignedBus ? (
            <div className="rounded-md bg-slate-50 p-2.5 border border-slate-200 text-xs text-slate-700">
              <p className="font-semibold">
                Assigned Bus: <strong>{selectedStudent.assignedBus.busNumber}</strong> ({selectedStudent.assignedBus.vehicleNumber})
              </p>
            </div>
          ) : (
            <div className="rounded-md bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-800">
              💡 Student has no assigned bus yet. Select route and stop below.
            </div>
          )}

          <div>
            <Label required>Select Route</Label>
            <Select
              value={selectedRouteId}
              onValueChange={(val) => {
                setSelectedRouteId(val);
                setSelectedStopId('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select route..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-slate-500">
                  🚫 Unassigned (No Route)
                </SelectItem>
                {routes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({r.stops?.length || 0} Stops)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label required>Select Pickup/Drop Stop</Label>
            <Select value={selectedStopId} onValueChange={setSelectedStopId}>
              <SelectTrigger>
                <SelectValue placeholder="Select pickup/drop stop..." />
              </SelectTrigger>
              <SelectContent>
                {(!selectedRouteObj?.stops || selectedRouteObj.stops.length === 0) ? (
                  <SelectItem value="none" disabled>
                    No stops configured for this route
                  </SelectItem>
                ) : (
                  selectedRouteObj.stops.map((stop) => (
                    <SelectItem key={stop.id} value={stop.id}>
                      Stop {stop.sequence}: {stop.name} (Est: {stop.estimatedTime || 'N/A'})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !selectedStopId || selectedStopId === 'none'}
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Save Stop Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
