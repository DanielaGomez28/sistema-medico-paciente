/**
 * Configuración de PostCSS.
 * Se utiliza principalmente para integrar Tailwind CSS en el pipeline de compilación.
 *
 * @type {import('postcss').ProcessOptions & { plugins?: Record<string, any> }}
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
