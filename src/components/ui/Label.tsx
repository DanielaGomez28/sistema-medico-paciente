import React from 'react';
import { cn } from '../../lib/utils';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export default function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-[10px] font-bold text-surface-500 uppercase tracking-wider', className)}
      {...props}
    >
      {children}
    </label>
  );
}
