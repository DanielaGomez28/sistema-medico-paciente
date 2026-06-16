import React from 'react';
import { cn } from '../../lib/utils';

export interface ListCardField {
  label: string;
  value: React.ReactNode;
}

export interface ListCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  fields?: ListCardField[];
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function ListCard({
  title,
  subtitle,
  badge,
  fields,
  actions,
  className,
  onClick,
}: ListCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'zenith-card w-full text-left p-4 space-y-3',
        onClick && 'hover:bg-surface-850/30 transition-colors cursor-pointer',
        className
      )}
    >
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground text-sm whitespace-normal break-words line-clamp-2 sm:whitespace-nowrap sm:truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-surface-500 mt-0.5 whitespace-normal break-words line-clamp-1 sm:whitespace-nowrap sm:truncate">
              {subtitle}
            </div>
          )}
        </div>
        {badge && <div className="shrink-0 self-start sm:self-auto">{badge}</div>}
      </div>

      {fields && fields.length > 0 && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 min-[420px]:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="min-w-0">
              <div className="zenith-field-label">{field.label}</div>
              <div className="text-xs text-surface-300 mt-0.5 break-words">{field.value}</div>
            </div>
          ))}
        </div>
      )}

      {actions && <div className="flex items-center gap-2 pt-1">{actions}</div>}
    </Wrapper>
  );
}
