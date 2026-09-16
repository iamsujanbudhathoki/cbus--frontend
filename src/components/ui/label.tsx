'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'block text-xs font-semibold text-slate-800 mb-1.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, children, required, ...props }, ref) => {
  let labelText = children;
  let isRequired = required;

  if (typeof children === 'string') {
    const trimmed = children.trim();
    if (trimmed.endsWith('*')) {
      isRequired = true;
      labelText = trimmed.slice(0, -1).trim();
    }
  }

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    >
      {labelText}
      {isRequired && (
        <span className="text-red-500 font-bold ml-1 select-none" aria-hidden="true">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

