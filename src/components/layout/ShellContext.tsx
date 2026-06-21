'use client';

import React, { createContext, useContext } from 'react';

/**
 * Valores expuestos por el contexto del AppShell.
 * @interface ShellContextValue
 * @property {boolean} sidebarOpen - Estado que indica si la barra lateral (móvil) está abierta.
 * @property {() => void} openSidebar - Función para abrir la barra lateral en vista móvil.
 * @property {() => void} closeSidebar - Función para cerrar la barra lateral en vista móvil.
 */
export interface ShellContextValue {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

/**
 * Proveedor de contexto para el AppShell.
 * Permite a los componentes descendientes (como la cabecera o botones internos) interactuar con el estado del Shell.
 *
 * @param {object} props - Propiedades del componente.
 * @param {ShellContextValue} props.value - Objeto con el estado y métodos de control del Shell.
 * @param {React.ReactNode} props.children - Componentes descendientes a renderizar.
 * @returns {JSX.Element} Proveedor de contexto.
 */
export function ShellProvider({
  value,
  children,
}: {
  value: ShellContextValue;
  children: React.ReactNode;
}) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

/**
 * Hook personalizado para acceder de forma segura al contexto del AppShell.
 * Útil para disparar aperturas/cierres del menú desde botones ubicados profundamente en la vista.
 *
 * @returns {ShellContextValue} Estado y métodos del shell.
 * @throws {Error} Si se usa fuera de un `<ShellProvider>`.
 */
export function useShell() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShell must be used within AppShell');
  }
  return context;
}
