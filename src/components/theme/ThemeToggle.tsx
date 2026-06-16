'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ThemeMode } from '../../lib/theme';
import { useTheme } from './ThemeProvider';

const options: { mode: ThemeMode; label: string; icon: React.ElementType }[] = [
  { mode: 'light', label: 'Claro', icon: Sun },
  { mode: 'dark', label: 'Oscuro', icon: Moon },
];

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-900 border border-surface-800',
        className
      )}
      role="group"
      aria-label="Tema de la interfaz"
    >
      {options.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => setTheme(mode)}
          title={label}
          aria-label={label}
          aria-pressed={theme === mode}
          className={cn(
            'p-1.5 rounded-md transition-colors cursor-pointer',
            theme === mode
              ? 'bg-surface-800 text-foreground shadow-sm'
              : 'text-surface-500 hover:text-foreground hover:bg-surface-850'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
