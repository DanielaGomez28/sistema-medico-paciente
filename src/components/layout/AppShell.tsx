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
export type AppShellHeaderRender = (props: { onMenuClick: () => void }) => React.ReactNode;

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
  const mainRef = useRef<HTMLElement>(null);

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
  };

  const headerContent =
    typeof header === 'function' ? header({ onMenuClick: shellValue.openSidebar }) : header;

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
                /* Siempre 'fixed' (nunca 'static'): al desplegar con el hover,
                   la barra queda flotando ENCIMA del contenido (lo tapa un
                   poco) en vez de empujarlo/redimensionarlo. Por eso el resto
                   de la pantalla (header, contenido) nunca se mueve. */
                ? 'sidebar-collapsible w-64 lg:w-[5rem] lg:hover:w-64 lg:hover:shadow-2xl lg:will-change-[width] transition-[width,transform,box-shadow] duration-300 ease-in-out lg:translate-x-0'
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
            'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden',
            layout === 'vertical-collapsible' && 'lg:ml-[5rem]'
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
