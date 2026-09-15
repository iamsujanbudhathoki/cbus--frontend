import React from 'react';

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
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      <span className="text-4xl mb-2">{icon}</span>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>}
      {action ? (
        <div className="mt-4">{action}</div>
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyState;
