'use client';

import React from 'react';
import { Bell, Menu } from 'lucide-react';
import Button from '../ui/Button';

export interface AppHeaderProps {
  statusLabel?: string;
  actions?: React.ReactNode;
  profileInitials?: string;
  profileName?: string;
  notificationCount?: number;
  trailing?: React.ReactNode;
  showNotifications?: boolean;
  onMenuClick?: () => void;
}

export default function AppHeader({
  statusLabel = 'Servicio Activo',
  actions,
  profileInitials = 'CM',
  profileName = 'Carlos M.',
  notificationCount = 0,
  trailing,
  showNotifications = true,
  onMenuClick,
}: AppHeaderProps) {
  return (
    <header className="h-16 border-b border-surface-900 flex items-center justify-between px-4 md:px-6 lg:px-8 bg-surface-950/80 backdrop-blur-md z-10 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-900 transition-colors cursor-pointer shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-surface-300 shrink-0" />
          <span className="text-xs text-surface-400 font-medium tracking-wider uppercase truncate">
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        {actions}
        {showNotifications && (
          <div className="relative cursor-pointer p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-900 transition-colors">
            <Bell className="h-4.5 w-4.5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-white/80" />
            )}
          </div>
        )}
        {trailing ?? (
          <div className="flex items-center gap-2 border-l border-surface-850 pl-3 sm:pl-4">
            <div className="h-7 w-7 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-xs font-semibold text-white">
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
    <Button variant="outline" size="sm" onClick={onClick}>
      <span className="sm:hidden">+</span>
      <span className="hidden sm:inline">{children}</span>
    </Button>
  );
}
