import React from 'react';
import { Bus, Driver } from '@/lib/types';
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
import { AlertCircle, Loader2 } from 'lucide-react';

interface BusAssignDriverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBus: Bus | null;
  selectedDriverId: string;
  setSelectedDriverId: (id: string) => void;
  drivers: Driver[];
  driverAssignmentMap: Map<string, { busId: string; busNumber: string }>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function BusAssignDriverDialog({
  isOpen,
  onClose,
  selectedBus,
  selectedDriverId,
  setSelectedDriverId,
  drivers,
  driverAssignmentMap,
  onSubmit,
  isSubmitting,
}: BusAssignDriverDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver to {selectedBus?.busNumber}</DialogTitle>
          <DialogDescription>
            Select an available driver or unassign current driver.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label required>Select Driver</Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-slate-500">
                  🚫 Unassigned (No Driver)
                </SelectItem>
                {drivers.map((d) => {
                  const assignment = driverAssignmentMap.get(d.id);
                  const isAssignedToOther =
                    assignment && assignment.busId !== selectedBus?.id;
                  const isCurrentBusDriver =
                    assignment && assignment.busId === selectedBus?.id;

                  return (
                    <SelectItem key={d.id} value={d.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>👤 {d.name} ({d.phone})</span>
                        {isCurrentBusDriver && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">Current</span>
                        )}
                        {isAssignedToOther && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded">Assigned to {assignment.busNumber}</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedDriverId !== 'none' &&
            driverAssignmentMap.has(selectedDriverId) &&
            driverAssignmentMap.get(selectedDriverId)?.busId !== selectedBus?.id && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5 text-amber-800 text-xs">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Driver Currently Assigned</p>
                  <p className="mt-0.5 text-[11px] text-amber-700 leading-relaxed">
                    This driver is assigned to <strong>{driverAssignmentMap.get(selectedDriverId)?.busNumber}</strong>. Reassigning will update their primary bus.
                  </p>
                </div>
              </div>
            )}

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
            <Button type="submit" variant="emerald" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Save Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
