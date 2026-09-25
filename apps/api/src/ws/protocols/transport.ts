import { WebSocket } from "ws";

export type SocketPayload = Record<string, unknown>;

export function send(socket: WebSocket, payload: SocketPayload): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}
