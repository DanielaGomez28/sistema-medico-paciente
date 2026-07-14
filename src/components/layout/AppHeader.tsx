'use client';

/**
 * @fileoverview Componente de layout app header.
 * @description Resuelve la estructura visual reutilizable del portal y su navegaci?n principal.
 */

import React from 'react';
import { Bell, Menu, Plus } from 'lucide-react';
import Button from '../ui/Button';
import { ThemeToggle } from '../theme';

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
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-surface-850 bg-surface-900/95 backdrop-blur-md shrink-0 px-4 py-2 sm:px-4 sm:py-0 sm:h-16 sm:min-h-16 md:px-6 lg:px-8">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:h-16">
        <div className="flex items-center gap-3 min-w-0">
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
          {statusLabel ? (
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-surface-300 shrink-0" />
              <span className="text-xs text-surface-400 font-medium tracking-wider uppercase truncate">
                {statusLabel}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 sm:shrink-0">
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
            <div className="flex items-center gap-2 border-l border-surface-850 pl-3 sm:pl-4">
              <div className="h-7 w-7 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-xs font-semibold text-foreground">
                {profileInitials}
              </div>
              <span className="text-xs font-semibold text-surface-300 hidden md:inline">{profileName}</span>
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
