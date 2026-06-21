import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Propiedades del componente base Card.
 *
 * @interface CardProps
 * @property {'default' | 'section'} [variant='default'] - Variante visual de la tarjeta.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'section';
}

/**
 * Contenedor principal estilo tarjeta con bordes, fondo y sombra predeterminados.
 *
 * @param {CardProps} props - Propiedades del contenedor.
 * @returns {JSX.Element} Elemento div contenedor estilizado como tarjeta.
 */
export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'zenith-card p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Encabezado estandarizado para tarjetas. Usualmente contiene el título y acciones principales.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Propiedades del contenedor.
 * @returns {JSX.Element} Elemento div alineado para usarse como encabezado.
 */
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Contenido principal interno de la tarjeta. Incluye espaciado vertical estandarizado.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Propiedades del contenedor.
 * @returns {JSX.Element} Elemento div para el contenido interno.
 */
export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  );
}
