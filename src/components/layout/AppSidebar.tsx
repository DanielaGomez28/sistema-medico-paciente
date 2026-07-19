'use client';

/**
 * @fileoverview Componente de layout app sidebar.
 * @description Resuelve la estructura visual reutilizable del portal y su navegación principal.
 */

import React from 'react';
import { LucideIcon, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import NavItem, { AccentVariant, NavItemConfig } from './NavItem';
import { useShell } from './ShellContext';

/**
 * Configuración visual de la marca a mostrar en la parte superior del sidebar.
 * @interface AppSidebarBrand
 * @property {LucideIcon} icon - Ícono o logo de la marca.
 * @property {string} title - Nombre principal de la aplicación o módulo.
 * @property {string} [subtitle] - Subtítulo opcional (ej: rol o entorno).
 */
export interface AppSidebarBrand {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

/**
 * Información del perfil de usuario para mostrar en la parte inferior del sidebar.
 * @interface AppSidebarProfile
 * @property {string} initials - Iniciales para el avatar (ej: 'JD').
 * @property {string} name - Nombre completo a mostrar.
 * @property {string} [role] - Rol o posición del usuario.
 * @property {string} [avatarClassName] - Estilos adicionales para el avatar.
 */
export interface AppSidebarProfile {
  initials: string;
  name: string;
  role?: string;
  avatarClassName?: string;
}

/**
 * Propiedades de configuración para la barra lateral de la aplicación.
 * @interface AppSidebarProps
 * @property {AppSidebarBrand} brand - Logo y título.
 * @property {NavItemConfig[]} items - Elementos de navegación principales.
 * @property {string} activeId - ID del elemento de navegación actualmente activo.
 * @property {(id: string) => void} onNavigate - Callback ejecutado al seleccionar un ítem de menú.
 * @property {AccentVariant} [accent='primary'] - Acento de color primario a usar en los íconos e ítems activos.
 * @property {string} [sectionLabel] - Etiqueta opcional para agrupar visualmente los ítems de navegación.
 * @property {React.ReactNode} [sidebarExtra] - Componente extra para renderizar debajo de la cabecera (ej: botón de acción).
 * @property {React.ReactNode} [preProfile] - Contenido a mostrar justo arriba del perfil de usuario.
 * @property {AppSidebarProfile} [profile] - Datos del perfil del usuario logueado.
 * @property {() => void} [onLogout] - Acción ejecutada para cerrar sesión.
 * @property {string} [logoutLabel='Cerrar Sesión'] - Texto a mostrar o anunciar para la acción de logout.
 * @property {'icon' | 'full'} [logoutVariant='icon'] - Estilo de botón para el logout.
 * @property {string} [className] - Clases adicionales.
 */
export interface AppSidebarProps {
  brand: AppSidebarBrand;
  items: NavItemConfig[];
  activeId: string;
  onNavigate: (id: string) => void;
  accent?: AccentVariant;
  sectionLabel?: string;
  sidebarExtra?: React.ReactNode;
  preProfile?: React.ReactNode;
  profile?: AppSidebarProfile;
  onLogout?: () => void;
  logoutLabel?: string;
  logoutVariant?: 'icon' | 'full';
  className?: string;
}

const brandGradient: Record<AccentVariant, string> = {
  primary: 'bg-surface-800 border border-surface-700',
  secondary: 'bg-surface-800 border border-surface-700',
};

/**
 * Barra lateral (Sidebar) principal de navegación.
 * Muestra la sección de branding, botones de navegación dinámicos, y el bloque inferior de perfil.
 *
 * @param {AppSidebarProps} props - Propiedades del sidebar.
 * @returns {JSX.Element}
 */
export default function AppSidebar({
  brand,
  items,
  activeId,
  onNavigate,
  accent = 'primary',
  sectionLabel,
  sidebarExtra,
  preProfile,
  profile,
  onLogout,
  logoutLabel = 'Cerrar Sesión',
  logoutVariant = 'icon',
  className,
}: AppSidebarProps) {
  const BrandIcon = brand.icon;
  const { closeSidebar } = useShell();

  const handleNavigate = (id: string) => {
    onNavigate(id);
    closeSidebar();
  };

  return (
    <aside
      className={cn(
        'w-full h-full bg-surface-900 border-r border-surface-850 flex flex-col text-surface-300',
        className
      )}
    >
      <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-850 bg-surface-900/95 backdrop-blur-md">
        <div
          className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center text-foreground',
            brandGradient[accent]
          )}
        >
          <BrandIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground tracking-tight text-base leading-none truncate">{brand.title}</h1>
          {brand.subtitle ? (
            <span className="zenith-field-label tracking-wider uppercase truncate block">
              {brand.subtitle}
            </span>
          ) : null}
        </div>
      </div>

      {sidebarExtra}

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {sectionLabel && (
          <div className="zenith-field-label px-4 py-2 text-[10px] uppercase tracking-wider">
            {sectionLabel}
          </div>
        )}
        {items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            accent={accent}
            onClick={() => handleNavigate(item.id)}
          />
        ))}
      </nav>

      {(profile || onLogout || preProfile) && (
        <div className="p-4 border-t border-surface-850 bg-surface-900/80 space-y-3">
          {preProfile}
          {profile && (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-900/40 transition-colors duration-150">
              <div
                className={cn(
                  'h-10 w-10 rounded-full border border-surface-700 flex items-center justify-center font-bold text-foreground text-sm shrink-0',
                  profile.avatarClassName ?? 'bg-surface-800'
                )}
              >
                {profile.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{profile.name}</p>
                {profile.role ? (
                  <p className="text-xs text-surface-500 truncate">{profile.role}</p>
                ) : null}
              </div>
              {onLogout && logoutVariant === 'icon' && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="zenith-logout-btn zenith-logout-btn--icon"
                  title={logoutLabel}
                  aria-label={logoutLabel}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {onLogout && logoutVariant === 'full' && (
            <button type="button" onClick={onLogout} className="zenith-logout-btn w-full">
              <LogOut className="h-3.5 w-3.5" />
              <span>{logoutLabel}</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
