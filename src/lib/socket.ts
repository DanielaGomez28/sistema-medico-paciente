import { io } from "socket.io-client";

// Next.js usa 'process.env.NEXT_PUBLIC_...' o tu variable de entorno del .env
// Ponemos un respaldo directo al puerto 4000 para asegurar el tiro en local
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:4000";

console.log("🔌 Intentando conectar el Socket a la URL:", SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"] // Deja ambos para evitar bloqueos locales
});