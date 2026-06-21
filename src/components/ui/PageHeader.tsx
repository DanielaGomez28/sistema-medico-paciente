import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Propiedades del componente PageHeader.
 *
 * @interface PageHeaderProps
 * @property {string} [title] - Título principal de la página.
 * @property {string} [description] - Subtítulo o descripción breve de la sección.
 * @property {React.ReactNode} [actions] - Botones o componentes de acción (ej: "Crear Nuevo").
 * @property {string} [className] - Clases CSS adicionales.
 */
export interface PageHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Encabezado estándar a nivel de página o vista principal.
 * Muestra el título, subtítulo a la izquierda y acciones a la derecha, de forma responsive.
 *
 * @param {PageHeaderProps} props - Propiedades del encabezado.
 * @returns {JSX.Element} Contenedor con cabecera.
 */
export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
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
