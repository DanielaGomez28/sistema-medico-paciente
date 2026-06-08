'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import Button from '../ui/Button';

export interface AppHeaderProps {
  statusLabel?: string;
  actions?: React.ReactNode;
  profileInitials?: string;
  profileName?: string;
  notificationCount?: number;
  trailing?: React.ReactNode;
  showNotifications?: boolean;
}

export default function AppHeader({
  statusLabel = 'Servicio Activo',
  actions,
  profileInitials = 'CM',
  profileName = 'Carlos M.',
  notificationCount = 0,
  trailing,
  showNotifications = true,
}: AppHeaderProps) {
  return (
    <header className="h-16 border-b border-surface-900 flex items-center justify-between px-8 bg-surface-950/80 backdrop-blur-md z-10 shrink-0">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-secondary-500 animate-ping" />
        <span className="text-xs text-surface-400 font-semibold tracking-wider uppercase">
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {actions}
        {showNotifications && (
          <div className="relative cursor-pointer p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-900 transition-colors">
            <Bell className="h-4.5 w-4.5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-secondary-500 shadow-md shadow-secondary-500/50" />
            )}
          </div>
        )}
        {trailing ?? (
          <div className="flex items-center gap-2 border-l border-surface-850 pl-4">
            <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
              {profileInitials}
            </div>
            <span className="text-xs font-semibold text-surface-300 hidden md:inline">{profileName}</span>
          </div>
        )}
      </div>
    </header>
  );
}

export function AppHeaderAction({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="border border-primary-500/20 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 hover:text-primary-300">
      {children}
    </Button>
  );
}
