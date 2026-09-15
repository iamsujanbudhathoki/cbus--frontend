'use client';

import React from 'react';
import { AppProgressProvider as ProgressProvider } from '@bprogress/next';

export default function BProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="3.5px"
      color="#2563eb"
      options={{ showSpinner: false, speed: 400, trickleSpeed: 200 }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
}
