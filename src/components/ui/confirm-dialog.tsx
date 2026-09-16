'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  isLoading = false,
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b-0 pb-0 mb-0">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-md shrink-0 ${
                isDestructive
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              {isDestructive ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-slate-500 leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'destructive' : 'default'}
            size="sm"
            disabled={isLoading}
            onClick={async () => {
              await onConfirm();
            }}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
