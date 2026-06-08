import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AccentVariant = 'primary' | 'secondary';

export interface NavItemConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  badge?: number | null;
  badgeColor?: string;
}

interface NavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  accent: AccentVariant;
  onClick: () => void;
}

const accentActiveClasses: Record<AccentVariant, string> = {
  primary: 'bg-primary/10 text-white border-l-2 border-primary-500',
  secondary: 'bg-gradient-to-r from-secondary/10 to-secondary/10 text-white border-l-2 border-secondary-500',
};

const accentIconClasses: Record<AccentVariant, string> = {
  primary: 'text-primary-400',
  secondary: 'text-secondary-400',
};

const accentDotClasses: Record<AccentVariant, string> = {
  primary: 'bg-primary-500 shadow-[0_0_8px_rgba(80,233,248,0.5)]',
  secondary: 'bg-secondary-500 shadow-[0_0_8px_rgba(23,145,80,0.5)]',
};

export default function NavItem({ item, isActive, accent, onClick }: NavItemProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative border-l-2',
        isActive
          ? cn(accentActiveClasses[accent], 'font-semibold')
          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-900/50 border-transparent'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
          isActive ? accentIconClasses[accent] : 'text-surface-400 group-hover:text-surface-300'
        )}
      />
      <span>{item.name}</span>
      {item.badge != null && item.badgeColor && (
        <span className={cn('ml-auto px-2 py-0.5 text-xs font-bold rounded-full', item.badgeColor)}>
          {item.badge}
        </span>
      )}
      {isActive && (
        <span className={cn('absolute right-3 w-1.5 h-1.5 rounded-full', accentDotClasses[accent])} />
      )}
    </button>
  );
}
