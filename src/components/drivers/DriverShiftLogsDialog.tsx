import React from 'react';
import { Driver, DriverShift, ShiftStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react';

interface DriverShiftLogsDialogProps {
  selectedDriverLogs: Driver | null;
  onClose: () => void;
  shiftLogs: DriverShift[];
  isLogsLoading: boolean;
}

export function DriverShiftLogsDialog({
  selectedDriverLogs,
  onClose,
  shiftLogs,
  isLogsLoading,
}: DriverShiftLogsDialogProps) {
  const formatDuration = (totalSec?: number) => {
    if (!totalSec) return '0m';
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={!!selectedDriverLogs} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Work Session Logs for {selectedDriverLogs?.name}</DialogTitle>
          <DialogDescription>
            Operational shift history, recorded timestamps, and reported notes.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {isLogsLoading ? (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-400">Loading shift logs...</p>
            </div>
          ) : shiftLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <Calendar className="h-6 w-6 text-slate-300 mx-auto" />
              <p>No shift logs recorded for this driver yet.</p>
            </div>
          ) : (
            shiftLogs.map((shift) => (
              <div
                key={shift.id}
                className="rounded-md border border-slate-200 bg-slate-50/50 p-3 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={shift.status === ShiftStatus.RUNNING ? 'emerald' : 'secondary'}>
                      <CheckCircle2 className="h-3 w-3" />
                      {shift.status}
                    </Badge>
                    <span className="font-semibold text-slate-800">
                      {formatDate(shift.startedAt)}
                    </span>
                  </div>

                  <span className="font-mono text-slate-700 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                    {formatDuration(shift.durationSeconds)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Bus:</span>
                    <span className="font-semibold text-slate-900">
                      {shift.busNumberSnap || shift.bus?.busNumber || 'N/A'}
                    </span>{' '}
                    <span className="font-mono text-[11px] text-slate-500">
                      ({shift.vehicleNumberSnap || shift.bus?.vehicleNumber || 'N/A'})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block">Time Window:</span>
                    <span className="font-medium text-slate-800">
                      {formatTime(shift.startedAt)} - {formatTime(shift.endedAt)}
                    </span>
                  </div>
                </div>

                {shift.notes && (
                  <div className="rounded bg-white border border-slate-200 p-2 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-500">Driver Notes: </span>
                    {shift.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
