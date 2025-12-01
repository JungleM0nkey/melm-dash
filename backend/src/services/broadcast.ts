import type { WebSocket } from 'ws';
import type { WebSocketMessage, WebSocketMessageType } from '@melm-dash/shared-types';

/**
 * Manages WebSocket client connections and broadcasts
 */
export class BroadcastManager {
  private clients: Set<WebSocket> = new Set();

  addClient(socket: WebSocket): void {
    this.clients.add(socket);

    socket.on('close', () => {
      this.clients.delete(socket);
    });

    socket.on('error', () => {
      this.clients.delete(socket);
    });
  }

  removeClient(socket: WebSocket): void {
    this.clients.delete(socket);
  }

  broadcast<T>(type: WebSocketMessageType, payload: T): void {
    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    const data = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(data);
        } catch (error) {
          console.error('Error broadcasting to client:', error);
          this.clients.delete(client);
        }
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  // Send to a specific client
  send<T>(socket: WebSocket, type: WebSocketMessageType, payload: T): void {
    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    if (socket.readyState === 1) {
      socket.send(JSON.stringify(message));
    }
  }
}

// Singleton instance
export const broadcastManager = new BroadcastManager();
