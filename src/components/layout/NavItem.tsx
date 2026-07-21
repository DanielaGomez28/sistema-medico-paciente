/**
 * @fileoverview Componente de layout nav item.
 * @description Resuelve la estructura visual reutilizable del portal y su navegación principal.
 */
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Variantes de color de acento soportadas para los elementos de navegación.
 * @type {AccentVariant}
 */
export type AccentVariant = 'primary' | 'secondary';

/**
 * Configuración de un elemento de menú en el sidebar.
 * @interface NavItemConfig
 * @property {string} id - Identificador único de la ruta o vista.
 * @property {string} name - Etiqueta a mostrar.
 * @property {LucideIcon} icon - Componente de ícono de Lucide.
 * @property {number | null} [badge] - Contador o valor para mostrar una insignia numérica.
 * @property {string} [badgeColor] - Clases CSS (ej. 'bg-red-500 text-white') para la insignia.
 */
export interface NavItemConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  badge?: number | null;
  badgeColor?: string;
}

/**
 * Propiedades internas para el componente NavItem.
 * @interface NavItemProps
 */
interface NavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  accent: AccentVariant;
  onClick: () => void;
  navTextWhite?: boolean;
  navTextDarkCyan?: boolean;
}

const accentActiveClasses: Record<AccentVariant, string> = {
  primary:
    'bg-[var(--zenith-nav-active-bg)] text-foreground border-l-2 border-[var(--zenith-nav-active-border)]',
  secondary:
    'bg-[var(--zenith-nav-active-bg)] text-foreground border-l-2 border-[var(--zenith-nav-active-border)]',
};

const accentIconClasses: Record<AccentVariant, string> = {
  primary: 'text-foreground',
  secondary: 'text-foreground',
};

const accentDotClasses: Record<AccentVariant, string> = {
  primary: 'bg-[var(--zenith-nav-active-dot)]',
  secondary: 'bg-[var(--zenith-nav-active-dot)]',
};

/**
 * Componente individual de elemento de menú en la barra lateral.
 * Renderiza un botón interactivo con estado de activo/inactivo y animaciones de hover.
 *
 * @param {NavItemProps} props - Propiedades del ítem de navegación.
 * @returns {JSX.Element}
 */
export default function NavItem({ item, isActive, accent, onClick, navTextWhite, navTextDarkCyan }: NavItemProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-control)] text-sm transition-all duration-200 group relative border-l-2',
        navTextWhite
          ? (isActive ? 'bg-white/20 text-white border-white' : 'text-white border-transparent hover:bg-white/10 hover:text-white')
          : navTextDarkCyan
            ? (isActive ? 'bg-[#055058]/20 text-[#055058] border-[#055058]' : 'text-[#055058] border-transparent hover:bg-[#055058]/10 hover:text-[#055058]')
            : (isActive ? accentActiveClasses[accent] : 'text-surface-500 hover:text-foreground hover:bg-surface-850 border-transparent')
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
          navTextWhite
            ? 'text-white'
            : navTextDarkCyan
              ? 'text-[#055058]'
              : (isActive ? accentIconClasses[accent] : 'text-surface-400 group-hover:text-surface-300')
        )}
      />
      <span
        className={cn(
          'zenith-nav-label flex-1 min-w-0 text-left whitespace-nowrap truncate',
          isActive && !navTextWhite && !navTextDarkCyan && 'zenith-nav-label--active',
          navTextWhite && 'text-white font-bold',
          navTextDarkCyan && 'text-[#055058] font-bold'
        )}
        title={item.name}
      >
        {item.name}
      </span>
      {item.badge != null && item.badgeColor && (
        <span className={cn('ml-auto px-2 py-0.5 text-xs font-bold rounded-full', item.badgeColor)}>
          {item.badge}
        </span>
      )}
      {isActive && (
        <span className={cn('absolute right-3 w-1.5 h-1.5 rounded-full', navTextWhite ? 'bg-white' : navTextDarkCyan ? 'bg-[#055058]' : accentDotClasses[accent])} />
      )}
    </button>
  );
}
