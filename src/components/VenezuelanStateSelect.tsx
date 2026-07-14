'use client';

/**
 * @fileoverview Componente venezuelan state select.
 * @description Implementa una vista o flujo de interfaz ligado a la experiencia operativa del sistema.
 */

import { cn } from '../lib/utils';
import { VENEZUELAN_STATES, isVenezuelanState } from '../lib/venezuelanStates';

/**
 * Propiedades del componente select de estados de Venezuela.
 * @interface VenezuelanStateSelectProps
 * @property {string} value - Estado actualmente seleccionado.
 * @property {(value: string) => void} onChange - Callback invocado al seleccionar otro estado.
 * @property {boolean} [required] - Define si el input es obligatorio.
 * @property {boolean} [disabled] - Define si el input está deshabilitado.
 * @property {string} [className] - Clases adicionales.
 * @property {boolean} [allowEmpty=false] - Si es `true`, renderiza una opción vacía ("Seleccione...").
 * @property {string} [emptyLabel='Seleccione un estado'] - Texto a mostrar para la opción vacía.
 * @property {'primary' | 'secondary'} [accent='primary'] - Tema visual a usar (focus).
 */
interface VenezuelanStateSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  accent?: 'primary' | 'secondary';
}

const focusAccentClass = {
  primary: 'focus:border-primary-500',
  secondary: 'focus:border-secondary-500',
};

/**
 * Select estandarizado para elegir un Estado/Entidad Federal de Venezuela.
 * Asegura la compatibilidad hacia atrás: si el `value` existente no es un estado válido
 * (ej. datos legacy de España o internacionales), se renderiza igual para no perder la data existente.
 *
 * @param {VenezuelanStateSelectProps} props - Propiedades del select.
 * @returns {JSX.Element}
 */
export default function VenezuelanStateSelect({
  value,
  onChange,
  required,
  disabled,
  className,
  allowEmpty = false,
  emptyLabel = 'Seleccione un estado',
  accent = 'primary',
}: VenezuelanStateSelectProps) {
  return (
    <select
      required={required}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full bg-surface-950 border border-surface-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none',
        disabled && 'bg-surface-950/40 text-surface-550 cursor-not-allowed',
        !disabled && focusAccentClass[accent],
        className
      )}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {value && !isVenezuelanState(value) && <option value={value}>{value}</option>}
      {VENEZUELAN_STATES.map((state) => (
        <option key={state} value={state}>
          {state}
        </option>
      ))}
    </select>
  );
}
