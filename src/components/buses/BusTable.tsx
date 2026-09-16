import React from 'react';
import { Bus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Bus as BusIcon, UserCheck, UserX, Route as RouteIcon, Trash2 } from 'lucide-react';
import EmptyState from '@/components/shared/empty-state';

interface BusTableProps {
  buses: Bus[];
  isLoading: boolean;
  searchTerm: string;
  onAssignDriver: (bus: Bus) => void;
  onAssignRoute: (bus: Bus) => void;
  onUnassignDriver: (bus: Bus) => void;
  onDeleteBus: (bus: Bus) => void;
  onAddBus: () => void;
}

export function BusTable({
  buses,
  isLoading,
  searchTerm,
  onAssignDriver,
  onAssignRoute,
  onUnassignDriver,
  onDeleteBus,
  onAddBus,
}: BusTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 space-y-3">
        <div className="h-5 w-1/4 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <EmptyState
        title="No Fleet Buses Found"
        description={
          searchTerm
            ? `No buses matching "${searchTerm}". Try a different search term.`
            : 'No buses configured yet for this college fleet.'
        }
        actionLabel={searchTerm ? undefined : 'Add First Bus'}
        onAction={searchTerm ? undefined : onAddBus}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bus Number</TableHead>
          <TableHead>Vehicle Plate</TableHead>
          <TableHead>Capacity</TableHead>
          <TableHead>Assigned Driver</TableHead>
          <TableHead>Assigned Route</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {buses.map((b) => (
          <TableRow key={b.id}>
            <TableCell className="font-bold text-slate-900">
              <div className="flex items-center gap-2">
                <BusIcon className="h-4 w-4 text-blue-600 shrink-0" />
                {b.busNumber}
              </div>
            </TableCell>
            <TableCell className="font-mono text-slate-800 font-medium">
              {b.vehicleNumber}
            </TableCell>
            <TableCell className="text-slate-800 font-medium">{b.capacity} Seats</TableCell>

            <TableCell>
              {b.driver ? (
                <Badge variant="emerald" className="gap-1.5 py-0.5">
                  <UserCheck className="h-3 w-3" />
                  <span>{b.driver.name}</span>
                  <button
                    onClick={() => onUnassignDriver(b)}
                    className="ml-1 hover:text-emerald-950 cursor-pointer font-bold"
                    title="Unassign driver"
                  >
                    ✕
                  </button>
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <UserX className="h-3 w-3 text-slate-600" />
                  Unassigned
                </Badge>
              )}
            </TableCell>

            <TableCell>
              {b.assignedRoute ? (
                <Badge variant="default" className="gap-1.5">
                  <RouteIcon className="h-3 w-3" />
                  {b.assignedRoute.name}
                </Badge>
              ) : (
                <span className="text-slate-600 text-xs italic font-medium">Unassigned</span>
              )}
            </TableCell>

            <TableCell className="text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAssignDriver(b)}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {b.driver ? 'Change Driver' : 'Assign Driver'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAssignRoute(b)}
                >
                  <RouteIcon className="h-3.5 w-3.5" />
                  Assign Route
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onDeleteBus(b)}
                  title="Delete Bus"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
