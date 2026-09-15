import React from 'react';

export function LoadingState({ message = 'Loading application data...' }: { message?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3" />
      <p className="text-xs font-semibold text-gray-500">{message}</p>
    </div>
  );
}
