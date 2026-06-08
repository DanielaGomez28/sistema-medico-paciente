'use client';

import React, { createContext, useContext } from 'react';

export interface ShellContextValue {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({
  value,
  children,
}: {
  value: ShellContextValue;
  children: React.ReactNode;
}) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShell must be used within AppShell');
  }
  return context;
}
