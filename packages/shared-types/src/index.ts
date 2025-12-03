/**
 * @melm-dash/shared-types
 * Shared TypeScript types for MELM Dashboard
 * Single source of truth for backend and frontend type definitions
 */

// =============================================================================
// Core Metric Types
// =============================================================================

export interface CpuMetrics {
  usage: number;
  cores: number;
  physicalCores: number;
  model: string;
  speed: number;
}

export interface MemoryMetrics {
  usage: number;
  used: number;
  total: number;
  available: number;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting';
  uptime: number;
  cpu: number;
  memory: {
    usage: number;
    limit: number;
  };
}

export interface ListeningPort {
  port: number;
  protocol: 'tcp' | 'udp';
  service: string;
  process: string;
  pid?: number;
}

export interface StorageDrive {
  device: string;
  mountPoint: string;
  filesystem: string;
  total: number;
  used: number;
  available: number;
  usagePercent: number;
}

export interface NetworkInterface {
  name: string;
  ip: string;
  mac: string;
  status: 'up' | 'down';
  type: string;
}

export interface NetworkMetrics {
  download: number;
  upload: number;
  interfaces: NetworkInterface[];
}

export interface SystemService {
  name: string;
  status: 'running' | 'stopped' | 'failed' | 'unknown';
  uptime?: number;
}

export interface SystemInfo {
  hostname: string;
  os: string;
  kernel: string;
  uptime: number;
  packages: number;
  location: string;
  timezone: string;
  currentTime: string;
  distro?: string;           // Distribution ID (ubuntu, debian, arch, etc.)
  distroName?: string;       // Display name (Ubuntu, Debian, Arch Linux, etc.)
  inContainer?: boolean;     // Running in container
  containerType?: string;    // Container type (docker, podman, lxc, etc.)
}

// =============================================================================
// Time Series Types
// =============================================================================

export interface TimeSeriesPoint<T> {
  timestamp: number;
  data: T;
}

export interface NetworkHistoryPoint {
  download: number;
  upload: number;
}

// =============================================================================
// Snapshot / State Types
// =============================================================================

export interface MetricsSnapshot {
  cpu: CpuMetrics | null;
  memory: MemoryMetrics | null;
  docker: DockerContainer[];
  ports: ListeningPort[];
  storage: StorageDrive[];
  network: NetworkMetrics | null;
  services: SystemService[];
  system: SystemInfo | null;
  cpuHistory: TimeSeriesPoint<number>[];
  memoryHistory: TimeSeriesPoint<number>[];
  networkHistory: TimeSeriesPoint<NetworkHistoryPoint>[];
}

// =============================================================================
// WebSocket Message Types
// =============================================================================

export type WebSocketMessageType =
  | 'initial'
  | 'cpu'
  | 'memory'
  | 'docker'
  | 'ports'
  | 'storage'
  | 'network'
  | 'services'
  | 'system'
  | 'ping'
  | 'pong'
  | 'error';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: number;
}

// =============================================================================
// WebSocket Payload Types (for type-safe message handling)
// =============================================================================

export interface InitialPayload extends MetricsSnapshot {}

export interface CpuPayload extends CpuMetrics {
  history: TimeSeriesPoint<number>[];
}

export interface MemoryPayload extends MemoryMetrics {
  history: TimeSeriesPoint<number>[];
}

export interface NetworkPayload extends NetworkMetrics {
  history: TimeSeriesPoint<NetworkHistoryPoint>[];
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

// =============================================================================
// Connection Types
// =============================================================================

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// =============================================================================
// Discriminated Union for Type-Safe Message Handling
// =============================================================================

export type TypedWebSocketMessage =
  | { type: 'initial'; payload: InitialPayload; timestamp: number }
  | { type: 'cpu'; payload: CpuPayload; timestamp: number }
  | { type: 'memory'; payload: MemoryPayload; timestamp: number }
  | { type: 'docker'; payload: DockerContainer[]; timestamp: number }
  | { type: 'ports'; payload: ListeningPort[]; timestamp: number }
  | { type: 'storage'; payload: StorageDrive[]; timestamp: number }
  | { type: 'network'; payload: NetworkPayload; timestamp: number }
  | { type: 'services'; payload: SystemService[]; timestamp: number }
  | { type: 'system'; payload: SystemInfo; timestamp: number }
  | { type: 'ping'; payload: null; timestamp: number }
  | { type: 'pong'; payload: null; timestamp: number }
  | { type: 'error'; payload: ErrorPayload; timestamp: number };

// =============================================================================
// Client Message Types (messages from client to server)
// =============================================================================

export type ClientMessageType = 'ping' | 'subscribe' | 'unsubscribe';

export interface ClientMessage {
  type: ClientMessageType;
}

export interface PingMessage extends ClientMessage {
  type: 'ping';
}

export interface SubscribeMessage extends ClientMessage {
  type: 'subscribe';
  metrics: WebSocketMessageType[];
}

export interface UnsubscribeMessage extends ClientMessage {
  type: 'unsubscribe';
  metrics: WebSocketMessageType[];
}

export type TypedClientMessage = PingMessage | SubscribeMessage | UnsubscribeMessage;
