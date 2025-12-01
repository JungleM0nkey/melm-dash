import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectionTracker, MessageRateLimiter, wsLimits } from './security.js';

describe('ConnectionTracker', () => {
  let tracker: ConnectionTracker;

  beforeEach(() => {
    tracker = new ConnectionTracker();
  });

  it('should allow connection when under limit', () => {
    const result = tracker.canConnect('192.168.1.1');
    expect(result.allowed).toBe(true);
  });

  it('should track connections by IP', () => {
    tracker.addConnection('192.168.1.1');
    tracker.addConnection('192.168.1.1');
    tracker.addConnection('192.168.1.2');

    const stats = tracker.getStats();
    expect(stats.total).toBe(3);
    expect(stats.byIp.get('192.168.1.1')).toBe(2);
    expect(stats.byIp.get('192.168.1.2')).toBe(1);
  });

  it('should reject when per-IP limit exceeded', () => {
    const ip = '192.168.1.1';

    // Add connections up to the limit
    for (let i = 0; i < wsLimits.maxConnectionsPerIp; i++) {
      tracker.addConnection(ip);
    }

    const result = tracker.canConnect(ip);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Per-IP');
  });

  it('should allow different IPs when one is at limit', () => {
    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';

    for (let i = 0; i < wsLimits.maxConnectionsPerIp; i++) {
      tracker.addConnection(ip1);
    }

    const result = tracker.canConnect(ip2);
    expect(result.allowed).toBe(true);
  });

  it('should decrement count on removal', () => {
    tracker.addConnection('192.168.1.1');
    tracker.addConnection('192.168.1.1');
    tracker.removeConnection('192.168.1.1');

    const stats = tracker.getStats();
    expect(stats.total).toBe(1);
    expect(stats.byIp.get('192.168.1.1')).toBe(1);
  });

  it('should remove IP from map when count reaches zero', () => {
    tracker.addConnection('192.168.1.1');
    tracker.removeConnection('192.168.1.1');

    const stats = tracker.getStats();
    expect(stats.byIp.has('192.168.1.1')).toBe(false);
  });
});

describe('MessageRateLimiter', () => {
  let limiter: MessageRateLimiter;

  beforeEach(() => {
    limiter = new MessageRateLimiter();
  });

  it('should allow messages under rate limit', () => {
    const clientId = 'client1';

    for (let i = 0; i < wsLimits.messageRateLimit; i++) {
      expect(limiter.isAllowed(clientId)).toBe(true);
    }
  });

  it('should block messages over rate limit', () => {
    const clientId = 'client1';

    // Exhaust the rate limit
    for (let i = 0; i < wsLimits.messageRateLimit; i++) {
      limiter.isAllowed(clientId);
    }

    // Next message should be blocked
    expect(limiter.isAllowed(clientId)).toBe(false);
  });

  it('should track different clients independently', () => {
    const client1 = 'client1';
    const client2 = 'client2';

    // Exhaust client1's limit
    for (let i = 0; i < wsLimits.messageRateLimit; i++) {
      limiter.isAllowed(client1);
    }

    // client2 should still be allowed
    expect(limiter.isAllowed(client2)).toBe(true);
  });

  it('should remove client data on cleanup', () => {
    limiter.isAllowed('client1');
    limiter.removeClient('client1');

    // After removal, should start fresh
    let count = 0;
    while (limiter.isAllowed('client1') && count < wsLimits.messageRateLimit + 5) {
      count++;
    }
    expect(count).toBe(wsLimits.messageRateLimit);
  });
});
