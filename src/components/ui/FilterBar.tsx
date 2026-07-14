/**
 * @fileoverview Componente UI filter bar.
 * @description Aporta una pieza visual reutilizable del sistema de interfaz del frontend.
 */
import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Propiedades del componente FilterBar.
 *
 * @interface FilterBarProps
 * @property {1 | 2 | 3 | 4} [columns=4] - Número de columnas en las que se divide la barra de filtros en pantallas grandes.
 */
export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Contenedor para agrupar controles de filtrado (inputs, selects).
 * Organiza los hijos en un grid responsive de acuerdo a la cantidad de columnas especificadas.
 *
 * @param {FilterBarProps} props - Propiedades del componente.
 * @returns {JSX.Element} Contenedor grid estilizado.
 */
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
