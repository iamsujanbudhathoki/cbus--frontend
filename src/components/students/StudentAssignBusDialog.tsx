import React from 'react';
import { Bus, Student } from '@/lib/types';
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

interface StudentAssignBusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent: Student | null;
  selectedBusId: string;
  setSelectedBusId: (id: string) => void;
  buses: Bus[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function StudentAssignBusDialog({
  isOpen,
  onClose,
  selectedStudent,
  selectedBusId,
  setSelectedBusId,
  buses,
  onSubmit,
  isSubmitting,
}: StudentAssignBusDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Bus to {selectedStudent?.name}</DialogTitle>
          <DialogDescription>
            Select a bus for this student.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label required>Select Bus</Label>
            <Select value={selectedBusId} onValueChange={setSelectedBusId}>
              <SelectTrigger>
                <SelectValue placeholder="Select bus..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-slate-500">
                  🚫 Unassigned (No Bus)
                </SelectItem>
                {buses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.busNumber} ({b.vehicleNumber}) - Route: {b.assignedRoute?.name || 'No Route'}
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
            <Button type="submit" variant="emerald" size="sm" disabled={isSubmitting || !selectedBusId}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Save Bus Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
