import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatWidgetProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  badge?: React.ReactNode;
}

export function StatWidget({ title, value, icon: Icon, description, badge }: StatWidgetProps) {
  return (
    <div className="flex flex-col justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-slate-700 shrink-0" />}
          <span className="text-xs font-semibold text-slate-800">{title}</span>
        </div>
        {badge}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {description && <span className="text-[11px] font-medium text-slate-600">{description}</span>}
      </div>
    </div>
  );
}
