import React from 'react';
import { cn } from '../../lib/utils';

export interface PageHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-950/95 backdrop-blur-md py-4',
        className
      )}
    >
      {(title || description) && (
        <div>
          {title && <h2 className="zenith-page-title">{title}</h2>}
          {description && <p className="zenith-page-subtitle">{description}</p>}
        </div>
      )}
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 self-start sm:w-auto sm:justify-end sm:self-center [&>button]:min-w-0">
          {actions}
        </div>
      )}
    </div>
  );
}
