'use client';

/**
 * @fileoverview Componente de layout app shell.
 * @description Resuelve la estructura visual reutilizable del portal y su navegación principal.
 */

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { ShellProvider } from './ShellContext';

/**
 * Función de renderizado para inyectar métodos del AppShell (como abrir el menú) en la cabecera.
 * @type {AppShellHeaderRender}
 */
export type AppShellHeaderRender = (props: {
  onMenuClick: () => void;
  desktopSidebarExpanded: boolean;
  toggleDesktopSidebar: () => void;
}) => React.ReactNode;

/**
 * Roles soportados para los portales de la aplicación.
 * @type {PortalRole}
 */
export type PortalRole = 'doctor' | 'patient' | 'admin';

/**
 * Propiedades del componente AppShell.
 *
 * @interface AppShellProps
 * @property {PortalRole} [portal] - Rol actual, usado para atributos de datos y estilos condicionales.
 * @property {React.ReactNode} sidebar - Componente de la barra lateral (AppSidebar).
 * @property {React.ReactNode | AppShellHeaderRender} [header] - Componente de la cabecera, o función render que inyecta `onMenuClick`.
 * @property {React.ReactNode} children - Contenido principal o vistas hijas renderizadas dentro del shell.
 * @property {string} [className] - Clases CSS adicionales para el contenedor raíz.
 * @property {string} [contentClassName] - Clases CSS adicionales para el área de contenido principal.
 */
export interface AppShellProps {
  portal?: PortalRole;
  sidebar: React.ReactNode;
  header?: React.ReactNode | AppShellHeaderRender;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  layout?: 'vertical' | 'horizontal' | 'vertical-collapsible';
  /** Identificador de la pantalla/pestaña activa (ej. el `activeTab`). Cada vez
   * que cambia, el área de contenido vuelve a hacer scroll hasta arriba. */
  scrollKey?: string | number;
}

/**
 * Layout principal y envolvente de la aplicación.
 * Orquesta la barra lateral, la cabecera y el área de contenido. Además, gestiona la visibilidad del menú en dispositivos móviles.
 *
 * @param {AppShellProps} props - Propiedades de configuración del layout.
 * @returns {JSX.Element} Estructura principal de la aplicación.
 */
export default function AppShell({
  portal,
  sidebar,
  header,
  children,
  className,
  contentClassName,
  layout = 'vertical',
  scrollKey,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const supportsDesktopSidebarToggle = layout === 'vertical-collapsible' && portal === 'admin';

  useEffect(() => {
    if (!supportsDesktopSidebarToggle) return;
    const stored = window.localStorage.getItem('admin-sidebar-expanded');
    if (stored === 'true') {
      setDesktopSidebarExpanded(true);
    }
  }, [supportsDesktopSidebarToggle]);

  useEffect(() => {
    if (!supportsDesktopSidebarToggle) return;
    window.localStorage.setItem('admin-sidebar-expanded', String(desktopSidebarExpanded));
  }, [desktopSidebarExpanded, supportsDesktopSidebarToggle]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [scrollKey]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const shellValue = {
    sidebarOpen,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
    desktopSidebarExpanded,
    toggleDesktopSidebar: () => setDesktopSidebarExpanded((current) => !current),
  };

  const headerContent =
    typeof header === 'function'
      ? header({
          onMenuClick: shellValue.openSidebar,
          desktopSidebarExpanded,
          toggleDesktopSidebar: shellValue.toggleDesktopSidebar,
        })
      : header;

  return (
    <ShellProvider value={shellValue}>
      <div
        data-portal={portal}
        className={cn('flex h-[100dvh] bg-surface-950 text-foreground overflow-hidden font-sans', className)}
      >
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-surface-950/60 backdrop-blur-sm lg:hidden"
            onClick={shellValue.closeSidebar}
            aria-label="Cerrar menú"
          />
        )}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-40 shrink-0 group overflow-hidden',
            layout === 'horizontal'
              ? 'w-64 lg:hidden transition-transform duration-200'
              : layout === 'vertical-collapsible'
                ? cn(
                    'sidebar-collapsible w-64 lg:translate-x-0 transition-[width,transform,box-shadow,margin] duration-300 ease-in-out',
                    desktopSidebarExpanded
                      ? 'lg:w-64 sidebar-collapsible--expanded lg:shadow-2xl'
                      : 'lg:w-[5rem]'
                  )
                : 'w-64 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className={cn('h-full', layout === 'vertical-collapsible' ? 'w-full' : 'w-64')}>
            {sidebar}
          </div>
        </div>
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden transition-[margin] duration-300 ease-in-out',
            layout === 'vertical-collapsible' && (desktopSidebarExpanded ? 'lg:ml-64' : 'lg:ml-[5rem]')
          )}
        >
          {headerContent}
          <main
            ref={mainRef}
            className="portal-main flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-y-contain touch-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8 bg-surface-950 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
          >
            <div className={cn('w-full max-w-[96rem] mx-auto', contentClassName)}>{children}</div>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
