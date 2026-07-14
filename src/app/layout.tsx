/**
 * @fileoverview Layout ra?z del frontend SMP Farmahumana.
 * @description Define la estructura compartida, providers globales y metadatos base de la aplicaci?n.
 */
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider, ThemeScript } from "../components/theme";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Médico-Paciente - Sistema de Gestión de Pedidos",
  description: "Plataforma premium para el control de inventario, registro de clientes y seguimiento de pedidos en tiempo real.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Root Layout principal de la aplicación Next.js.
 * Configura la estructura base del DOM (HTML/Body), la inyección de fuentes globales (Geist y Inter),
 * aplica variables globales CSS y envuelve a la aplicación con los proveedores de contexto (ThemeProvider).
 * 
 * @param {Readonly<{ children: React.ReactNode }>} props - Propiedades, contiene los hijos a renderizar.
 * @returns {JSX.Element}
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <head suppressHydrationWarning>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
