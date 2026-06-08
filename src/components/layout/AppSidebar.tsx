'use client';

import React from 'react';
import { LucideIcon, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import NavItem, { AccentVariant, NavItemConfig } from './NavItem';
import { useShell } from './ShellContext';

export interface AppSidebarBrand {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export interface AppSidebarProfile {
  initials: string;
  name: string;
  role: string;
  avatarClassName?: string;
}

export interface AppSidebarProps {
  brand: AppSidebarBrand;
  items: NavItemConfig[];
  activeId: string;
  onNavigate: (id: string) => void;
  accent?: AccentVariant;
  sectionLabel?: string;
  sidebarExtra?: React.ReactNode;
  profile?: AppSidebarProfile;
  onLogout?: () => void;
  logoutLabel?: string;
  logoutVariant?: 'icon' | 'full';
  className?: string;
}

const brandGradient: Record<AccentVariant, string> = {
  primary: 'bg-surface-800 border border-surface-700',
  secondary: 'bg-surface-800 border border-surface-700',
};

export default function AppSidebar({
  brand,
  items,
  activeId,
  onNavigate,
  accent = 'primary',
  sectionLabel,
  sidebarExtra,
  profile,
  onLogout,
  logoutLabel = 'Cerrar Sesión',
  logoutVariant = 'full',
  className,
}: AppSidebarProps) {
  const BrandIcon = brand.icon;
  const { closeSidebar } = useShell();

  const handleNavigate = (id: string) => {
    onNavigate(id);
    closeSidebar();
  };

  return (
    <aside
      className={cn(
        'w-full h-full bg-surface-950 border-r border-surface-900 flex flex-col text-surface-300',
        className
      )}
    >
      <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-900 bg-surface-950/50 backdrop-blur-md">
        <div
          className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center text-white',
            brandGradient[accent]
          )}
        >
          <BrandIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-white tracking-tight text-base leading-none">{brand.title}</h1>
          <span className="text-[10px] text-surface-500 font-medium tracking-wider uppercase">
            {brand.subtitle}
          </span>
        </div>
      </div>

      {sidebarExtra}

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {sectionLabel && (
          <div className="px-4 py-2 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">
            {sectionLabel}
          </div>
        )}
        {items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            accent={accent}
            onClick={() => handleNavigate(item.id)}
          />
        ))}
      </nav>

      {(profile || onLogout) && (
        <div className="p-4 border-t border-surface-900 bg-surface-950/20 space-y-3">
          {profile && (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-900/40 transition-colors duration-150">
              <div
                className={cn(
                  'h-10 w-10 rounded-full border border-surface-700 flex items-center justify-center font-bold text-white text-sm shrink-0',
                  profile.avatarClassName ?? 'bg-surface-800'
                )}
              >
                {profile.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
                <p className="text-xs text-surface-500 truncate">{profile.role}</p>
              </div>
              {onLogout && logoutVariant === 'icon' && (
                <button
                  onClick={onLogout}
                  className="text-surface-500 hover:text-secondary-450 transition-colors p-1.5 hover:bg-surface-800/60 rounded-lg cursor-pointer"
                  title={logoutLabel}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {onLogout && logoutVariant === 'full' && (
            <button
              onClick={onLogout}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
                accent === 'secondary'
                  ? 'text-secondary-400 hover:text-secondary-300 hover:bg-secondary-500/10 border border-secondary-500/20'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800 border border-surface-800'
              )}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{logoutLabel}</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
