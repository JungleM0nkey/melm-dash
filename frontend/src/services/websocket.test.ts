import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketClient, createWebSocketClient } from './websocket';
import type { ConnectionStatus } from '@melm-dash/shared-types';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CLOSED;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: Error) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    Promise.resolve().then(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    });
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1000, reason: 'Normal closure' });
  });
}

describe('WebSocketClient', () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    originalWebSocket = window.WebSocket;
    window.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.WebSocket = originalWebSocket;
  });

  it('should create a client with correct URL', () => {
    const client = new WebSocketClient({
      url: 'ws://localhost:3001/ws',
    });

    expect(client).toBeDefined();
    expect(client.getStatus()).toBe('disconnected');
  });

  it('should call status change callback on connection', async () => {
    const statusChanges: ConnectionStatus[] = [];
    const client = new WebSocketClient({
      url: 'ws://localhost:3001/ws',
      onStatusChange: (status) => statusChanges.push(status),
      pingInterval: 60000, // Long interval to avoid timer issues
    });

    client.connect();

    // Wait for microtask to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(statusChanges).toContain('connected');

    client.disconnect();
  });

  it('should register and trigger message handlers', async () => {
    const client = new WebSocketClient({
      url: 'ws://localhost:3001/ws',
      pingInterval: 60000,
    });

    const cpuHandler = vi.fn();
    client.on('cpu', cpuHandler);

    client.connect();

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate receiving a message
    const mockWs = (client as unknown as { ws: MockWebSocket }).ws;
    const cpuPayload = { usage: 50, cores: 4, model: 'Test', speed: 2.5 };
    mockWs.onmessage?.({
      data: JSON.stringify({
        type: 'cpu',
        payload: cpuPayload,
        timestamp: Date.now(),
      }),
    });

    expect(cpuHandler).toHaveBeenCalledWith(cpuPayload, expect.any(Number));

    client.disconnect();
  });

  it('should disconnect properly', async () => {
    const statusChanges: ConnectionStatus[] = [];
    const client = new WebSocketClient({
      url: 'ws://localhost:3001/ws',
      onStatusChange: (status) => statusChanges.push(status),
      pingInterval: 60000,
    });

    client.connect();

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 10));

    client.disconnect();

    expect(client.getStatus()).toBe('disconnected');
  });

  it('should unregister message handlers', async () => {
    const client = new WebSocketClient({
      url: 'ws://localhost:3001/ws',
      pingInterval: 60000,
    });

    const cpuHandler = vi.fn();
    client.on('cpu', cpuHandler);
    client.off('cpu');

    client.connect();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate receiving a message
    const mockWs = (client as unknown as { ws: MockWebSocket }).ws;
    mockWs.onmessage?.({
      data: JSON.stringify({
        type: 'cpu',
        payload: { usage: 50, cores: 4, model: 'Test', speed: 2.5 },
        timestamp: Date.now(),
      }),
    });

    expect(cpuHandler).not.toHaveBeenCalled();

    client.disconnect();
  });
});

describe('createWebSocketClient', () => {
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        protocol: 'http:',
      },
      writable: true,
    });
  });

  it('should create client with correct WebSocket URL', () => {
    const client = createWebSocketClient('localhost', 3001);

    expect(client).toBeDefined();
    expect(client.getStatus()).toBe('disconnected');
  });

  it('should use wss protocol for https pages', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        protocol: 'https:',
      },
      writable: true,
    });

    const client = createWebSocketClient('localhost', 3001);
    expect(client).toBeDefined();
  });
});
