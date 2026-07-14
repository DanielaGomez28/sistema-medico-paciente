/**
 * @fileoverview Componente UI textarea.
 * @description Aporta una pieza visual reutilizable del sistema de interfaz del frontend.
 */
import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Propiedades del componente Textarea.
 * Extiende las propiedades nativas de un textarea HTML.
 * @type {TextareaProps}
 */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Componente de área de texto estandarizado.
 * Soporta ref-forwarding para integración sencilla con librerías de formularios.
 *
 * @type {React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>}
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-surface-300 focus:outline-none focus:border-primary-500 font-mono leading-relaxed transition-colors',
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
