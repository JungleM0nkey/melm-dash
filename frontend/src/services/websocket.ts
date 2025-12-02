import type {
  WebSocketMessage,
  WebSocketMessageType,
  InitialPayload,
  CpuPayload,
  MemoryPayload,
  NetworkPayload,
  DockerContainer,
  ListeningPort,
  StorageDrive,
  SystemService,
  SystemInfo,
  ConnectionStatus,
} from '@melm-dash/shared-types';

export type MessageHandler<T = unknown> = (payload: T, timestamp: number) => void;

interface MessageHandlers {
  initial: MessageHandler<InitialPayload>;
  cpu: MessageHandler<CpuPayload>;
  memory: MessageHandler<MemoryPayload>;
  docker: MessageHandler<DockerContainer[]>;
  ports: MessageHandler<ListeningPort[]>;
  storage: MessageHandler<StorageDrive[]>;
  network: MessageHandler<NetworkPayload>;
  services: MessageHandler<SystemService[]>;
  system: MessageHandler<SystemInfo>;
  pong: MessageHandler<{ timestamp: number }>;
}

export interface WebSocketClientOptions {
  url: string;
  /** Base reconnect interval in ms (default: 1000) */
  reconnectInterval?: number;
  /** Maximum reconnect delay in ms (default: 30000) */
  maxReconnectDelay?: number;
  /** Maximum reconnect attempts before giving up (default: 10, 0 = infinite) */
  maxReconnectAttempts?: number;
  /** Ping interval in ms (default: 30000) */
  pingInterval?: number;
  /** Status change callback */
  onStatusChange?: (status: ConnectionStatus) => void;
}

/**
 * Calculate exponential backoff with jitter
 * Formula: min(maxDelay, baseDelay * 2^attempt) + random jitter
 */
function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
  const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
  // Add jitter: ±25% randomization to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(exponentialDelay + jitter);
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectDelay: number;
  private maxReconnectAttempts: number;
  private pingInterval: number;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private handlers: Partial<MessageHandlers> = {};
  private onStatusChange?: (status: ConnectionStatus) => void;
  private status: ConnectionStatus = 'disconnected';
  private manuallyDisconnected = false;

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval ?? 1000;
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.pingInterval = options.pingInterval ?? 30000;
    this.onStatusChange = options.onStatusChange;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear manual disconnect flag when explicitly connecting
    this.manuallyDisconnected = false;

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Manually trigger a reconnection attempt
   * Useful when user wants to retry after max attempts reached
   */
  reconnect(): void {
    this.reconnectAttempts = 0;
    this.manuallyDisconnected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connect();
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.startPing();
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    const { type, payload, timestamp } = message;
    const handler = this.handlers[type as keyof MessageHandlers];

    if (handler) {
      (handler as MessageHandler)(payload, timestamp);
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.onStatusChange?.(status);
    }
  }

  private scheduleReconnect(): void {
    // Don't reconnect if manually disconnected
    if (this.manuallyDisconnected) {
      this.setStatus('disconnected');
      return;
    }

    // Check max attempts (0 = infinite retries)
    if (this.maxReconnectAttempts > 0 && this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('disconnected');
      return;
    }

    this.setStatus('reconnecting');
    this.reconnectAttempts++;

    // Calculate delay with exponential backoff and jitter
    const delay = calculateBackoff(
      this.reconnectAttempts - 1,
      this.reconnectInterval,
      this.maxReconnectDelay
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send('ping', { timestamp: Date.now() });
    }, this.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  send(type: WebSocketMessageType, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on<T extends keyof MessageHandlers>(
    type: T,
    handler: MessageHandlers[T]
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.handlers as any)[type] = handler;
  }

  off(type: keyof MessageHandlers): void {
    delete this.handlers[type];
  }

  disconnect(): void {
    // Mark as manually disconnected to prevent auto-reconnect
    this.manuallyDisconnected = true;
    this.stopPing();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }
}

// Factory function for creating WebSocket client
export function createWebSocketClient(
  host: string = window.location.hostname,
  port: number = Number(import.meta.env.VITE_WS_PORT) || 3001,
  onStatusChange?: (status: ConnectionStatus) => void
): WebSocketClient {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${host}:${port}/ws`;

  return new WebSocketClient({
    url,
    onStatusChange,
  });
}
