import React from 'react';
import { Student } from '@/lib/types';
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

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
  searchTerm: string;
  onAssignBus: (student: Student) => void;
  onAssignStop: (student: Student) => void;
  onAddStudent: () => void;
}

export function StudentTable({
  students,
  isLoading,
  searchTerm,
  onAssignBus,
  onAssignStop,
  onAddStudent,
}: StudentTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 space-y-3">
        <div className="h-5 w-1/4 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        title="No Students Found"
        description={
          searchTerm
            ? `No students matching "${searchTerm}". Try a different search term.`
            : 'No student records created yet for this college.'
        }
        actionLabel={searchTerm ? undefined : 'Add First Student'}
        onAction={searchTerm ? undefined : onAddStudent}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student Name</TableHead>
          <TableHead>Roll No.</TableHead>
          <TableHead>Class / Sec</TableHead>
          <TableHead>Assigned Bus</TableHead>
          <TableHead>Pickup/Drop Stop</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-bold text-slate-900">{s.name}</TableCell>
            <TableCell className="font-mono text-slate-800 font-medium">{s.rollNumber || '-'}</TableCell>
            <TableCell className="text-slate-800 font-medium">{s.className} {s.section ? `(${s.section})` : ''}</TableCell>
            <TableCell>
              {s.assignedBus ? (
                <Badge variant="emerald">
                  🚌 {s.assignedBus.busNumber}
                </Badge>
              ) : (
                <span className="text-slate-600 text-xs italic font-medium">Unassigned</span>
              )}
            </TableCell>
            <TableCell>
              {s.assignedStop ? (
                <Badge variant="default">
                  📍 {s.assignedStop.name}
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
                  onClick={() => onAssignBus(s)}
                >
                  Assign Bus
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAssignStop(s)}
                >
                  Assign Stop
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
