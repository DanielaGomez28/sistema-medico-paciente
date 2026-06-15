import { THEME_STORAGE_KEY } from '../../lib/theme';

export default function ThemeScript() {
  const script = `
(function() {
  try {
    var key = '${THEME_STORAGE_KEY}';
    var mode = localStorage.getItem(key) || 'system';
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {}
})();`;

  return (
    <script
      id="zenith-theme-script"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
