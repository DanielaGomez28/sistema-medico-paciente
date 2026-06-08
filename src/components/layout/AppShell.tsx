'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { ShellProvider } from './ShellContext';

export type AppShellHeaderRender = (props: { onMenuClick: () => void }) => React.ReactNode;
export type PortalRole = 'doctor' | 'patient' | 'admin';

export interface AppShellProps {
  portal?: PortalRole;
  sidebar: React.ReactNode;
  header?: React.ReactNode | AppShellHeaderRender;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function AppShell({
  portal,
  sidebar,
  header,
  children,
  className,
  contentClassName,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const shellValue = {
    sidebarOpen,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
  };

  const headerContent =
    typeof header === 'function' ? header({ onMenuClick: shellValue.openSidebar }) : header;

  return (
    <ShellProvider value={shellValue}>
      <div
        data-portal={portal}
        className={cn('flex h-screen bg-surface-950 text-surface-100 overflow-hidden font-sans', className)}
      >
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-surface-950/60 backdrop-blur-sm lg:hidden"
            onClick={shellValue.closeSidebar}
            aria-label="Cerrar menú"
          />
        )}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 shrink-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebar}
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {headerContent}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-surface-950/20">
            <div className={cn('max-w-7xl mx-auto', contentClassName)}>{children}</div>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
