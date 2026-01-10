import { io } from "socket.io-client";

export function makeSocket() {
  const base = import.meta.env.VITE_SOCKET_URL || new URL(import.meta.env.VITE_API_URL).origin;
  return io(base, { transports: ["websocket", "polling"] });
}
