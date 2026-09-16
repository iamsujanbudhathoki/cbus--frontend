import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TableToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  action?: React.ReactNode;
}

export function TableToolbar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  action,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-600" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
