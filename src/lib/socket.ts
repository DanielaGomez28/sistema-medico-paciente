import { io, Socket } from 'socket.io-client';

/**
 * Cliente Singleton de WebSockets (Socket.IO) para conexión bidireccional con el Backend.
 * @type {Socket}
 * @constant socket
 * @description Utiliza la variable de entorno NEXT_PUBLIC_SOCKET_URL definida en el entorno de Frontend.
 */
const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
});

export default socket;
