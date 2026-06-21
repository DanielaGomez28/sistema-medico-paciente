import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Propiedades del componente Select.
 * Extiende las propiedades nativas de un elemento select HTML.
 * @type {SelectProps}
 */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Componente de lista desplegable (Select) estandarizado.
 * Soporta ref-forwarding para integración sencilla con formularios.
 *
 * @type {React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLSelectElement>>}
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn('zenith-input px-3 py-2', className)}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';

export default Select;
