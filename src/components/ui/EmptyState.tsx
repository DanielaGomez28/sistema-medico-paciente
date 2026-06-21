import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

/**
 * Propiedades del componente de estado vacío.
 *
 * @interface EmptyStateProps
 * @property {LucideIcon} icon - Componente de ícono (ej. de lucide-react) a mostrar.
 * @property {string} title - Título principal descriptivo del estado vacío.
 * @property {string} [description] - Descripción secundaria adicional (opcional).
 * @property {string} [className] - Clases CSS adicionales.
 */
export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Componente visual para mostrar cuando no hay datos disponibles en una lista, tabla o sección.
 * Muestra un ícono circular centrado con texto descriptivo.
 *
 * @param {EmptyStateProps} props - Propiedades del componente.
 * @returns {JSX.Element} Contenedor con el estado vacío.
 */
export default function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-24 text-surface-500 flex flex-col items-center justify-center p-6 bg-surface-900/20 border border-dashed border-surface-800 rounded-2xl',
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-surface-950 border border-surface-800 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-surface-600" />
      </div>
      <p className="font-semibold text-surface-400">{title}</p>
      {description && <p className="text-xs text-surface-500 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
