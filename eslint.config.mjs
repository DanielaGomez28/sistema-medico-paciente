import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Configuración de ESLint para el proyecto.
 * Combina reglas para Next.js (Web Vitals) y TypeScript.
 *
 * @type {import("eslint").Linter.Config[]}
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Ignorar archivos generados o de configuración por defecto.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
