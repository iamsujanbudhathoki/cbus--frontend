import React from 'react';
import { Bus, Route } from '@/lib/types';
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

interface BusAssignRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBus: Bus | null;
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;
  routes: Route[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function BusAssignRouteDialog({
  isOpen,
  onClose,
  selectedBus,
  selectedRouteId,
  setSelectedRouteId,
  routes,
  onSubmit,
  isSubmitting,
}: BusAssignRouteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Route to {selectedBus?.busNumber}</DialogTitle>
          <DialogDescription>
            Select a transport route for this vehicle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label required>Select Route</Label>
            <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
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
              Assign Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
