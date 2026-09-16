import React from 'react';
import { Driver } from '@/lib/types';
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
import EmptyState from '@/components/shared/empty-state';
import { History } from 'lucide-react';

interface DriverTableProps {
  drivers: Driver[];
  isLoading: boolean;
  searchTerm: string;
  onOpenLogs: (driver: Driver) => void;
  onAddDriver: () => void;
}

export function DriverTable({
  drivers,
  isLoading,
  searchTerm,
  onOpenLogs,
  onAddDriver,
}: DriverTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 space-y-3">
        <div className="h-5 w-1/4 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <EmptyState
        title="No Drivers Found"
        description={
          searchTerm
            ? `No drivers matching "${searchTerm}". Try a different search term.`
            : 'No drivers registered yet for this college.'
        }
        actionLabel={searchTerm ? undefined : 'Add First Driver'}
        onAction={searchTerm ? undefined : onAddDriver}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Driver Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>License Number</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Shift Logs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drivers.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-bold text-slate-900">{d.name}</TableCell>
            <TableCell className="text-slate-800 font-mono font-medium">{d.phone}</TableCell>
            <TableCell className="font-mono text-slate-800 font-medium">
              {d.licenseNumber || '-'}
            </TableCell>
            <TableCell>
              <Badge variant="emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {d.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right whitespace-nowrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenLogs(d)}
              >
                <History className="h-3.5 w-3.5" />
                Shift Logs
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
