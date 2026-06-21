'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  applyTheme,
  getStoredTheme,
  ThemeMode,
  THEME_STORAGE_KEY,
} from '../../lib/theme';

/**
 * Valores expuestos por el contexto del tema.
 * @interface ThemeContextValue
 * @property {ThemeMode} theme - Tema actualmente activo ('light', 'dark', 'system').
 * @property {(mode: ThemeMode) => void} setTheme - Función para cambiar y persistir el tema de la aplicación.
 */
interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Proveedor principal del tema de la aplicación.
 * Sincroniza el estado de React con el `localStorage` y actualiza el atributo `data-theme` del DOM de forma reactiva.
 * Debe envolver a los componentes en el árbol más alto posible (ej. RootLayout o AppShell).
 *
 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes descendientes.
 * @returns {JSX.Element} Proveedor de contexto para el tema.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

/**
 * Hook personalizado para acceder al estado y controles del tema visual.
 *
 * @returns {ThemeContextValue} Valores y funciones del tema.
 * @throws {Error} Si el hook se utiliza fuera de un `<ThemeProvider>`.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
