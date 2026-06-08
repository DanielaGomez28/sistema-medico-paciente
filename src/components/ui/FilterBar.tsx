import React from 'react';
import { cn } from '../../lib/utils';

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
}

export default function FilterBar({ columns = 4, className, children, ...props }: FilterBarProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('zenith-filter-bar', gridCols[columns], className)} {...props}>
      {children}
    </div>
  );
}
