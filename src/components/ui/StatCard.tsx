/**
 * @fileoverview Componente UI stat card.
 * @description Aporta una pieza visual reutilizable del sistema de interfaz del frontend.
 */
import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

/**
 * Propiedades de la tarjeta de estadística (KPI).
 *
 * @interface StatCardProps
 * @property {LucideIcon} icon - Ícono de la biblioteca lucide-react.
 * @property {string} label - Etiqueta superior descriptiva (ej: "Pacientes Activos").
 * @property {React.ReactNode} value - Valor numérico o texto principal a destacar.
 * @property {React.ReactNode} [hint] - Texto indicativo secundario (ej: "+5% vs mes anterior").
 * @property {'primary' | 'secondary'} [accent='primary'] - Acento de color para el ícono.
 * @property {string} [className] - Clases adicionales.
 */
export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: 'primary' | 'secondary';
  className?: string;
}

/**
 * Tarjeta para mostrar estadísticas de alto nivel y KPIs.
 * Ampliamente utilizada en los dashboards para resumir métricas críticas.
 *
 * @param {StatCardProps} props - Propiedades de la tarjeta.
 * @returns {JSX.Element} Tarjeta renderizada.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'primary',
  className,
}: StatCardProps) {
  const accentBg =
    accent === 'primary'
      ? 'portal-stat-icon'
      : 'bg-surface-800 text-surface-300';
  const hintColor = accent === 'primary' ? 'portal-stat-hint' : 'text-surface-400';

  return (
    <div
      className={cn(
        'relative overflow-hidden zenith-card p-5 group hover:border-surface-700 transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', accentBg)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-xs text-surface-400 font-medium">{label}</p>
        <p className="text-lg text-white tracking-tight mt-0.5 tabular-nums">{value}</p>
        {hint && (
          <div className={cn('mt-1 flex items-center gap-1 text-[10px] font-semibold', hintColor)}>
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
