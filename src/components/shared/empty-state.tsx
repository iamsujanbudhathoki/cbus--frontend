import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = '📦',
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
      <span className="text-3xl mb-2 select-none">{icon}</span>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>}
      {action ? (
        <div className="mt-3">{action}</div>
      ) : actionLabel && onAction ? (
        <Button
          onClick={onAction}
          size="sm"
          className="mt-3"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
