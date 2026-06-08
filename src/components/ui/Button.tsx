import React from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'patient' | 'doctor' | 'admin';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--zenith-btn-solid-bg)] text-[var(--zenith-btn-solid-fg)] hover:bg-[var(--zenith-btn-solid-hover)] border border-[var(--zenith-btn-solid-border)] shadow-sm',
  patient:
    'bg-[var(--portal-btn-bg)] text-[var(--portal-btn-fg)] hover:bg-[var(--portal-btn-hover)] border border-[var(--portal-btn-border)] shadow-sm',
  doctor:
    'bg-[var(--portal-btn-bg)] text-[var(--portal-btn-fg)] hover:bg-[var(--portal-btn-hover)] border border-[var(--portal-btn-border)] shadow-sm',
  admin:
    'bg-[var(--portal-btn-bg)] text-[var(--portal-btn-fg)] hover:bg-[var(--portal-btn-hover)] border border-[var(--portal-btn-border)] shadow-sm',
  secondary:
    'bg-surface-800 text-foreground hover:bg-surface-700 border border-surface-700',
  ghost:
    'bg-transparent text-surface-500 hover:text-foreground hover:bg-surface-850 border border-transparent',
  outline:
    'bg-surface-900 hover:bg-surface-850 border border-surface-700 text-foreground hover:text-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-4 text-xs rounded-xl',
  lg: 'h-11 px-6 text-sm rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-semibold leading-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
