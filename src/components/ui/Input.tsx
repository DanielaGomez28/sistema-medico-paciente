import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Propiedades del componente Input.
 * Extiende las propiedades nativas de un input HTML.
 *
 * @interface InputProps
 * @property {React.ReactNode} [icon] - Ícono a renderizar en el lado izquierdo del input.
 * @property {boolean} [error] - Si es `true`, aplica estilos visuales de error (borde rojo/secundario).
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
}

/**
 * Componente de campo de texto estándar.
 * Soporta renderizado de ícono embebido y estado visual de error.
 * Envuelto en forwardRef para permitir su uso con react-hook-form u otras librerías.
 *
 * @type {React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>}
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'zenith-input',
            icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2',
            error ? 'border-secondary/50 focus:border-secondary' : undefined,
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
