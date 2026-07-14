/**
 * @fileoverview Componente UI badge.
 * @description Aporta una pieza visual reutilizable del sistema de interfaz del frontend.
 */
import React from 'react';
import { cn } from '../../lib/utils';
import {
  getDispatchSemaphore,
  getDispatchStatusLabel,
  getOrderStatusClassName,
} from '../../lib/statusColors';
import { OrderStatus } from '../../types';

/**
 * Propiedades del componente Badge.
 * Extiende las propiedades nativas de un elemento span.
 *
 * @interface BadgeProps
 * @property {OrderStatus | string} [status] - Estado de la orden, utilizado para determinar el color de semáforo.
 * @property {'default' | 'primary' | 'secondary'} [variant='default'] - Variante visual genérica.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: OrderStatus | string;
  variant?: 'default' | 'primary' | 'secondary';
}

const variantClasses = {
  default: 'bg-surface-800 text-surface-200 border-surface-700',
  primary: 'bg-surface-800 text-surface-200 border-surface-600',
  secondary: 'bg-surface-800 text-foreground border-secondary/30',
};

/**
 * Componente de insignia (Badge) para mostrar etiquetas, estados o contadores.
 * Muestra automáticamente un punto de semáforo si se le pasa un `status`.
 *
 * @param {BadgeProps} props - Propiedades del componente.
 * @returns {JSX.Element} Elemento span estilizado.
 */
export default function Badge({ status, variant = 'default', className, children, ...props }: BadgeProps) {
  const statusClass = status ? getOrderStatusClassName(status) : variantClasses[variant];
  const semaphore = status ? getDispatchSemaphore(status) : null;
  const label =
    status && children === status ? getDispatchStatusLabel(status) : children;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-0.5 text-xs font-semibold border rounded-full',
        status ? statusClass : variantClasses[variant],
        className
      )}
      {...props}
    >
      {semaphore && (
        <span
          className={cn('dispatch-badge__dot', `dispatch-badge__dot--${semaphore}`)}
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}
