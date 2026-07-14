/**
 * @fileoverview Componente de tema theme script.
 * @description Gestiona apariencia, persistencia y sincronizaci?n del tema visual del frontend.
 */
import { THEME_STORAGE_KEY } from '../../lib/theme';

/**
 * Script en línea para inicializar el tema inmediatamente al cargar el HTML.
 * Debe ser inyectado en el `<head>` del documento antes de la carga de estilos.
 * Previene el efecto FOUC (Flash Of Unstyled Content) evaluando el `localStorage`
 * sincrónicamente y estableciendo el atributo `data-theme` en la etiqueta `<html>`.
 *
 * @returns {JSX.Element} Componente con etiqueta `<script>` y código en crudo (dangerouslySetInnerHTML).
 */
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
