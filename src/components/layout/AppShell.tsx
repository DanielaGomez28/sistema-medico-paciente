import React from 'react';
import { cn } from '../../lib/utils';

export interface AppShellProps {
  sidebar: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function AppShell({ sidebar, header, children, className, contentClassName }: AppShellProps) {
  return (
    <div className={cn('flex h-screen bg-surface-950 text-surface-100 overflow-hidden font-sans', className)}>
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {header}
        <main className="flex-1 overflow-y-auto p-8 bg-surface-950/20">
          <div className={cn('max-w-7xl mx-auto', contentClassName)}>{children}</div>
        </main>
      </div>
    </div>
  );
}
