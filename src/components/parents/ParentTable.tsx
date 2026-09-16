import React from 'react';
import { Parent } from '@/lib/types';
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
import { Edit, Trash2, UserPlus } from 'lucide-react';

interface ParentTableProps {
  parents: Parent[];
  isLoading: boolean;
  searchTerm: string;
  onEdit: (parent: Parent) => void;
  onLinkChild: (parent: Parent) => void;
  onDelete: (parentId: string) => void;
  onAddParent: () => void;
}

export function ParentTable({
  parents,
  isLoading,
  searchTerm,
  onEdit,
  onLinkChild,
  onDelete,
  onAddParent,
}: ParentTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 space-y-3">
        <div className="h-5 w-1/4 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (parents.length === 0) {
    return (
      <EmptyState
        title="No Parent Accounts Found"
        description={
          searchTerm
            ? `No parents matching "${searchTerm}". Try a different search term.`
            : 'No parent accounts created yet for this college.'
        }
        actionLabel={searchTerm ? undefined : 'Add First Parent'}
        onAction={searchTerm ? undefined : onAddParent}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Parent Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email Login</TableHead>
          <TableHead>Associated Children</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parents.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-bold text-slate-900">{p.name}</TableCell>
            <TableCell className="text-slate-800 font-mono font-medium">{p.phone || '-'}</TableCell>
            <TableCell className="font-mono text-slate-800 font-medium">{p.email || '-'}</TableCell>
            <TableCell>
              {p.students && p.students.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {p.students.map((st) => (
                    <Badge key={st.id} variant="default">
                      👦 {st.name} {st.rollNumber ? `(${st.rollNumber})` : ''}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-600 font-medium italic">No children linked</span>
              )}
            </TableCell>
            <TableCell className="text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(p)}
                  title="Edit Parent Account"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="emerald"
                  onClick={() => onLinkChild(p)}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Link Child
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onDelete(p.id)}
                  title="Delete Parent Account"
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
