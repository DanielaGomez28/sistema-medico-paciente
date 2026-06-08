import React from 'react';
import { cn } from '../../lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <div>
        <h2 className="text-2xl text-white tracking-tight">{title}</h2>
        {description && <p className="text-sm text-surface-400 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 self-start sm:self-center">{actions}</div>}
    </div>
  );
}
