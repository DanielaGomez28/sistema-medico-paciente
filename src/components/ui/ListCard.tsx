import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Campo de dato (par clave-valor) para mostrar dentro de una ListCard.
 * @interface ListCardField
 * @property {string} label - Título o etiqueta descriptiva del campo.
 * @property {React.ReactNode} value - Valor principal a mostrar.
 */
export interface ListCardField {
  label: string;
  value: React.ReactNode;
}

/**
 * Propiedades del componente ListCard.
 *
 * @interface ListCardProps
 * @property {React.ReactNode} title - Título principal de la tarjeta.
 * @property {React.ReactNode} [subtitle] - Subtítulo secundario (opcional).
 * @property {React.ReactNode} [badge] - Elemento visual (ej. Badge) a mostrar en la esquina superior.
 * @property {ListCardField[]} [fields] - Lista de campos de información adicionales.
 * @property {React.ReactNode} [actions] - Botones o acciones para mostrar al pie de la tarjeta.
 * @property {string} [className] - Clases CSS adicionales.
 * @property {() => void} [onClick] - Función a ejecutar al hacer clic. Convierte la tarjeta en interactiva.
 */
export interface ListCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  fields?: ListCardField[];
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Componente de tarjeta compacta para mostrar registros en formato lista o grid.
 * Utilizado ampliamente para mostrar pedidos, clientes o entidades similares.
 *
 * @param {ListCardProps} props - Propiedades del componente.
 * @returns {JSX.Element} Tarjeta renderizada.
 */
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
