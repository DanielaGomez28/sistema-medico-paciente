/**
 * @fileoverview Utilidad de frontend socket.
 * @description Agrupa helpers, clientes o transformaciones reutilizadas por los portales del cliente.
 */
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

function detectSocketRuntimeSupport(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return url.includes('localhost') || url.includes('127.0.0.1');
  }
}

export const SOCKET_RUNTIME_SUPPORTED = detectSocketRuntimeSupport(SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"]
});
