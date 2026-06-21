/**
 * Modos de tema de color soportados por la aplicación.
 * @type {ThemeMode}
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Clave utilizada para persistir la preferencia de tema en localStorage.
 * @constant {string}
 */
export const THEME_STORAGE_KEY = 'zenith-theme';

/**
 * Resuelve el tema actual. Puede extenderse en el futuro para soportar 'system'.
 *
 * @param {ThemeMode} mode - El tema a resolver.
 * @returns {'light' | 'dark'} El modo final a aplicar.
 */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode;
}

/**
 * Aplica el modo de tema modificando los atributos del elemento raíz HTML.
 *
 * @param {ThemeMode} mode - El tema que se desea aplicar.
 * @returns {void}
 */
export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolveTheme(mode));
}

/**
 * Recupera el tema guardado en localStorage.
 * Si no existe o estamos en el servidor, retorna el tema por defecto ('dark').
 *
 * @returns {ThemeMode} El tema recuperado.
 */
export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}
