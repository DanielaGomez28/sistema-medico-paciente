/**
 * @fileoverview Utilidad de frontend socket.
 * @description Agrupa helpers, clientes o transformaciones reutilizadas por los portales del cliente.
 */
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

/**
 * Determina si la URL de socket apunta a un entorno local (localhost/127.0.0.1),
 * el único entorno donde actualmente se soporta el runtime de sockets.
 *
 * @param {string} url - URL del servidor de sockets a evaluar.
 * @returns {boolean} `true` si la URL corresponde a un host local.
 */
function detectSocketRuntimeSupport(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return url.includes('localhost') || url.includes('127.0.0.1');
  }
}

/** Indica si el entorno actual soporta la conexión de sockets en tiempo real. */
export const SOCKET_RUNTIME_SUPPORTED = detectSocketRuntimeSupport(SOCKET_URL);

/** Cliente de socket.io compartido, con conexión manual y credenciales habilitadas. */
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"]
});
