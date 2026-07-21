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
  navTextWhite?: boolean;
  navTextDarkCyan?: boolean;
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
  navTextWhite = false,
  navTextDarkCyan = false,
}: AppSidebarProps) {
  const { closeSidebar } = useShell();

  const handleNavigate = (id: string) => {
    onNavigate(id);
    closeSidebar();
  };

  return (
    <aside
      className={cn(
        'w-full h-full bg-surface-900 border-r border-surface-850 flex flex-col text-surface-300',
        navTextWhite && 'zenith-nav-on-dark',
        className
      )}
    >
      <div className={cn("zc-row h-16 flex items-center gap-3 px-5 border-b backdrop-blur-md", navTextWhite ? "bg-transparent border-white/20" : navTextDarkCyan ? "bg-transparent border-[#055058]/20" : "bg-surface-900/95 border-surface-850")}>
        {/* Logo + Salud brand */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white shadow-sm">
          <img
            src="/logo.png"
            alt="Logo"
            width={26}
            height={26}
            style={{ display: 'block', width: '26px', height: '26px', objectFit: 'contain' }}
          />
        </div>
        <div className="zc-collapse-text min-w-0 flex-1">
          <h1 className={cn('tracking-tight leading-none truncate font-bold', navTextWhite ? 'text-white' : navTextDarkCyan ? 'text-[#055058]' : 'text-foreground')} style={{ fontSize: '24px' }}>+Salud</h1>
        </div>
      </div>

      {sidebarExtra}

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {sectionLabel && (
          <div className="zc-collapse-text zenith-field-label px-4 py-2 text-[10px] uppercase tracking-wider">
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
            navTextWhite={navTextWhite}
            navTextDarkCyan={navTextDarkCyan}
          />
        ))}
      </nav>

      {(profile || onLogout || preProfile) && (
        <div className={cn("p-4 border-t border-surface-850 space-y-3", navTextWhite ? "bg-black/10" : navTextDarkCyan ? "bg-[#055058]/5" : "bg-surface-900/80")}>
          {preProfile}
          {profile && (
            <div className={cn("zc-row flex items-center gap-3 p-2 rounded-xl transition-colors duration-150", navTextWhite ? "hover:bg-white/10" : navTextDarkCyan ? "hover:bg-[#055058]/10" : "hover:bg-surface-900/40")}>
              <div
                className={cn(
                  'h-10 w-10 rounded-full border flex items-center justify-center font-bold text-sm shrink-0',
                  navTextWhite ? 'bg-white/20 border-white/40 text-white' : navTextDarkCyan ? 'bg-[#055058]/15 border-[#055058]/30 text-[#055058]' : 'bg-surface-800 border-surface-700 text-foreground',
                  profile.avatarClassName
                )}
              >
                {profile.initials}
              </div>
              <div className="zc-collapse-text flex-1 min-w-0">
                <p className={cn("text-sm font-semibold truncate", navTextWhite ? "text-white" : navTextDarkCyan ? "text-[#055058]" : "text-foreground")}>{profile.name}</p>
                {profile.role ? (
                  <p className={cn("text-xs truncate", navTextWhite ? "text-white/80" : navTextDarkCyan ? "text-[#055058]/80" : "text-surface-500")}>{profile.role}</p>
                ) : null}
              </div>
              {onLogout && logoutVariant === 'icon' && (
                <button
                  type="button"
                  onClick={onLogout}
                  className={cn(
                    'zc-collapse-hide flex items-center justify-center transition-colors cursor-pointer shrink-0',
                    navTextWhite
                      ? 'h-10 w-10 rounded-full border border-red-500/30 bg-white text-red-500 hover:bg-white/90'
                      : navTextDarkCyan
                        ? 'p-2 rounded-lg text-[#055058] hover:text-red-800 hover:bg-[#055058]/10'
                        : 'p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-surface-900'
                  )}
                  title={logoutLabel}
                  aria-label={logoutLabel}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {!profile && onLogout && logoutVariant === 'icon' && (
            <button
              type="button"
              onClick={onLogout}
              className={cn("zc-row w-full flex items-center gap-3 p-2 rounded-xl transition-colors duration-150 cursor-pointer", navTextWhite ? "hover:bg-white/10" : navTextDarkCyan ? "hover:bg-[#055058]/10" : "hover:bg-surface-900/40")}
              title={logoutLabel}
              aria-label={logoutLabel}
            >
              <span
                className={cn(
                  'h-10 w-10 rounded-full border flex items-center justify-center shrink-0',
                  navTextWhite ? 'bg-white border-red-500/30 text-red-500' : navTextDarkCyan ? 'bg-[#055058]/15 border-[#055058]/30 text-[#055058]' : 'bg-surface-800 border-surface-700 text-red-500'
                )}
              >
                <LogOut className="h-4 w-4" />
              </span>
            </button>
          )}
          {onLogout && logoutVariant === 'full' && (
            <button type="button" onClick={onLogout} className={cn("w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors duration-200", navTextWhite ? "text-white bg-white/10 hover:bg-white/20" : navTextDarkCyan ? "text-[#055058] bg-[#055058]/10 hover:bg-[#055058]/20" : "zenith-logout-btn")}>
              <LogOut className="h-3.5 w-3.5" />
              <span>{logoutLabel}</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
