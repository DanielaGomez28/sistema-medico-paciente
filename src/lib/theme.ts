export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'zenith-theme';

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolveTheme(mode));
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}
