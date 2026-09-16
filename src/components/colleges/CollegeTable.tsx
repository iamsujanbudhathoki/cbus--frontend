import React from 'react';
import Link from 'next/link';
import { College, Status } from '@/lib/types';
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
import { School, ArrowRight } from 'lucide-react';

interface CollegeTableProps {
  colleges: College[];
  isLoading: boolean;
  searchTerm: string;
  onAddCollege: () => void;
}

export function CollegeTable({
  colleges,
  isLoading,
  searchTerm,
  onAddCollege,
}: CollegeTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 space-y-3">
        <div className="h-5 w-1/4 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (colleges.length === 0) {
    return (
      <EmptyState
        title="No Colleges Found"
        description={
          searchTerm
            ? `No colleges matching "${searchTerm}". Try a different search term.`
            : 'No educational institutions registered yet.'
        }
        actionLabel={searchTerm ? undefined : 'Add First College'}
        onAction={searchTerm ? undefined : onAddCollege}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>College Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {colleges.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-bold text-slate-900">
              <Link 
                href={`/super-admin/colleges/${c.id}`} 
                className="hover:text-blue-600 hover:underline flex items-center gap-2"
              >
                <School className="h-4 w-4 text-blue-600 shrink-0" />
                {c.name}
              </Link>
            </TableCell>
            <TableCell className="font-mono text-slate-800 font-medium">{c.code}</TableCell>
            <TableCell className="text-slate-800 font-medium">{c.address || '-'}</TableCell>
            <TableCell className="text-slate-800 font-medium">{c.contactPhone || '-'}</TableCell>
            <TableCell className="text-slate-800 font-medium">{c.contactEmail || '-'}</TableCell>
            <TableCell>
              <Badge variant={c.status === Status.ACTIVE ? 'emerald' : 'destructive'}>
                {c.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/super-admin/colleges/${c.id}`}>
                <Button size="sm" variant="outline">
                  View Details
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
