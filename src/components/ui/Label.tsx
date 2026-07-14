/**
 * @fileoverview Componente UI label.
 * @description Aporta una pieza visual reutilizable del sistema de interfaz del frontend.
 */
import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Propiedades del componente Label.
 * @type {LabelProps}
 */
export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

/**
 * Componente de etiqueta estandarizada para campos de formulario.
 *
 * @param {LabelProps} props - Propiedades del componente.
 * @returns {JSX.Element} Elemento label de HTML.
 */
export default function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('zenith-field-label', className)}
      {...props}
    >
      {children}
    </label>
  );
}
