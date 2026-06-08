'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, children, size = 'lg', className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-surface-950/75 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className={cn(
          'relative bg-surface-900 border border-surface-800 w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col text-surface-300 animate-in fade-in zoom-in-95 duration-200',
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-850 shrink-0">
            <div className="zenith-section-title">{title}</div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4 md:p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function ModalFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-3 px-4 md:px-6 py-4 border-t border-surface-850 [&>button]:w-full [&>button]:sm:w-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
