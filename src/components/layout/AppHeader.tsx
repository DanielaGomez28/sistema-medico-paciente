'use client';

/**
 * @fileoverview Componente de layout app header.
 * @description Resuelve la estructura visual reutilizable del portal y su navegación principal.
 */

import React from 'react';
import { Bell, Menu, Plus, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import { ThemeToggle } from '../theme';
import { AppSidebarBrand } from './AppSidebar';
import { NavItemConfig, AccentVariant } from './NavItem';
import { cn } from '../../lib/utils';

/**
 * Propiedades del componente AppHeader.
 *
 * @interface AppHeaderProps
 * @property {string} [statusLabel='Servicio Activo'] - Etiqueta de estado del sistema a mostrar.
 * @property {React.ReactNode} [actions] - Botones o acciones a mostrar en el lado derecho.
 * @property {string} [profileInitials='CM'] - Iniciales del usuario logueado.
 * @property {string} [profileName='Carlos M.'] - Nombre corto del usuario logueado.
 * @property {number} [notificationCount=0] - Número de notificaciones no leídas.
 * @property {React.ReactNode} [trailing] - Contenido personalizado para reemplazar la sección del perfil.
 * @property {boolean} [showNotifications=true] - Controla la visibilidad del ícono de notificaciones.
 * @property {() => void} [onMenuClick] - Callback para abrir el sidebar en dispositivos móviles.
 * @property {AppSidebarBrand} [brand] - Marca para mostrar al inicio de la barra superior.
 * @property {NavItemConfig[]} [items] - Elementos de navegación para menú horizontal.
 * @property {string} [activeId] - ID de navegación activo.
 * @property {(id: string) => void} [onNavigate] - Callback al navegar.
 * @property {AccentVariant} [accent='primary'] - Acento cromático del menú activo.
 * @property {string} [className] - Clases CSS adicionales para el elemento header raíz.
 */
export interface AppHeaderProps {
  statusLabel?: string;
  actions?: React.ReactNode;
  profileInitials?: string;
  profileName?: string;
  notificationCount?: number;
  trailing?: React.ReactNode;
  showNotifications?: boolean;
  onMenuClick?: () => void;
  brand?: AppSidebarBrand;
  items?: NavItemConfig[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  accent?: AccentVariant;
  onLogout?: () => void;
  className?: string;
  /** Si es true, los ítems de navegación y el nombre del perfil se renderizan en blanco */
  navTextWhite?: boolean;
}

/**
 * Cabecera principal de la aplicación.
 * Permite mostrar el estado, acciones rápidas, notificaciones y menú de perfil de usuario.
 * Se mantiene fija (sticky) en la parte superior.
 *
 * @param {AppHeaderProps} props - Propiedades del encabezado.
 * @returns {JSX.Element} Elemento cabecera.
 */
export default function AppHeader({
  statusLabel = 'Servicio Activo',
  actions,
  profileInitials = 'CM',
  profileName = 'Carlos M.',
  notificationCount = 0,
  trailing,
  showNotifications = true,
  onMenuClick,
  brand,
  items,
  activeId,
  onNavigate,
  accent = 'primary',
  onLogout,
  className,
  navTextWhite = false,
}: AppHeaderProps) {
  return (
    <header className={cn('sticky top-0 z-20 border-b border-surface-850 bg-surface-900/95 backdrop-blur-md shrink-0 px-4 py-2 sm:px-4 sm:py-0 sm:h-16 sm:min-h-16 md:px-6 lg:px-8', className)}>
      <div className="flex min-w-0 items-center gap-2 sm:h-16">

        {/* LEFT: Hamburger + Brand */}
        <div className="flex items-center gap-3 shrink-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-surface-400 hover:text-foreground hover:bg-surface-900 transition-colors cursor-pointer shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {brand && (
            <div className="hidden lg:flex items-center gap-2 shrink-0 border-r border-surface-850 pr-5 h-8">
              <img src="/logo.png" alt="Logo" width={28} height={28} style={{ display: 'block', width: '28px', height: '28px', objectFit: 'contain' }} />
              <div className="min-w-0 flex flex-col justify-center leading-none">
                <span className="tracking-tight text-[18px] font-bold text-foreground leading-none">+Salud</span>
              </div>
            </div>
          )}
          {statusLabel && !brand && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-surface-300 shrink-0" />
              <span className="text-xs text-surface-400 font-medium tracking-wider uppercase truncate">{statusLabel}</span>
            </div>
          )}
        </div>

        {/* CENTER-RIGHT: Navigation items pushed to right */}
        {items && onNavigate && (
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-end mr-4">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-[15px] font-bold transition-all duration-200 group cursor-pointer shrink-0',
                    navTextWhite
                      ? [
                          'hover:scale-[1.04] active:scale-[0.97] active:bg-white/15 active:shadow-sm',
                          isActive ? 'text-white bg-white/15 shadow-sm' : 'text-white',
                        ]
                      : [
                          'hover:scale-[1.04] active:scale-[0.97]',
                          isActive
                            ? 'text-foreground bg-surface-800/80 shadow-sm'
                            : 'text-surface-400 hover:text-foreground hover:bg-surface-850/60',
                        ]
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[15px] w-[15px] shrink-0 transition-all duration-200',
                      navTextWhite
                        ? isActive ? 'text-white' : 'text-white/80'
                        : isActive
                          ? 'text-primary-400'
                          : 'text-surface-500 group-hover:text-surface-300 group-hover:scale-110'
                    )}
                  />
                  <span className="relative">
                    {item.name}
                    {/* Active underline indicator */}
                    <span
                      className={cn(
                        'absolute -bottom-[3px] left-0 right-0 h-[2px] rounded-full transition-all duration-300',
                        isActive
                          ? navTextWhite ? 'bg-white opacity-100 scale-x-100' : 'bg-primary-400 opacity-100 scale-x-100'
                          : 'opacity-0 scale-x-0'
                      )}
                    />
                  </span>
                  {/* Hover glow ring — hidden when navTextWhite */}
                  {!isActive && !navTextWhite && (
                    <span className="absolute inset-0 rounded-lg ring-1 ring-surface-700/0 group-hover:ring-surface-700/60 transition-all duration-200" />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* RIGHT: Actions + Theme + Notifications + Profile */}
        <div className={cn('flex min-w-0 items-center justify-end gap-2 sm:gap-3 sm:shrink-0', (!items || !onNavigate) && 'flex-1')}>
          {actions}
          <ThemeToggle className="shrink-0" />
          {showNotifications && (
            <div className="relative cursor-pointer p-2 rounded-lg text-surface-400 hover:text-foreground hover:bg-surface-900 transition-colors">
              <Bell className="h-4.5 w-4.5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-primary-500 border-2 border-surface-950" />
              )}
            </div>
          )}
          {trailing ?? (
            <div className="flex items-center gap-3 border-l border-surface-850 pl-3 sm:pl-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-xs font-semibold text-foreground">
                  {profileInitials}
                </div>
                <span className="text-xs font-semibold text-surface-300 hidden md:inline">{profileName}</span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-surface-900 transition-colors cursor-pointer shrink-0"
                  title="Cerrar Sesión"
                  aria-label="Cerrar Sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

/**
 * Componente auxiliar para renderizar una acción común en el AppHeader (ej. "Nuevo Paciente").
 *
 * @param {object} props - Propiedades de la acción.
 * @param {React.ReactNode} props.children - Texto de la acción (el prefijo '+' se elimina si existe).
 * @param {() => void} [props.onClick] - Callback ejecutado al hacer clic.
 * @param {'outline' | 'admin'} [props.variant='outline'] - Variante visual del botón de acción.
 * @returns {JSX.Element}
 */
export function AppHeaderAction({
  children,
  onClick,
  variant = 'outline',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'outline' | 'admin';
}) {
  const label =
    typeof children === 'string' ? children.trim().replace(/^\+\s*/, '') : children;

  return (
    <Button variant={variant} size="sm" onClick={onClick} className="gap-1 px-3 sm:px-4">
      <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      <span className="hidden md:inline">{label}</span>
    </Button>
  );
}
