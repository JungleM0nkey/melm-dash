import type { FastifyCorsOptions } from '@fastify/cors';
import type { FastifyRateLimitOptions, RateLimitPluginOptions } from '@fastify/rate-limit';
import type { FastifyHelmetOptions } from '@fastify/helmet';
import type { FastifyRequest } from 'fastify';
import { env } from './env.js';

/**
 * Security configuration centralized for the application
 */

// CORS configuration
export function getCorsConfig(): FastifyCorsOptions {
  const isDev = env.NODE_ENV === 'development';

  return {
    // In development, allow all origins; in production, restrict to specific origins
    origin: isDev
      ? true
      : (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']),

    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  };
}

// Rate limiting configuration for API endpoints
export function getRateLimitConfig(): FastifyRateLimitOptions {
  return {
    max: 100, // Max 100 requests
    timeWindow: '1 minute',
    // Skip rate limiting for health checks
    allowList: (req: FastifyRequest) => req.url === '/health',
    // Custom error response
    errorResponseBuilder: (
      _req: FastifyRequest,
      context: { after: string; max: number; ttl: number }
    ) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    }),
  };
}

// Helmet security headers configuration
export function getHelmetConfig(): FastifyHelmetOptions {
  const isDev = env.NODE_ENV === 'development';

  return {
    // Content Security Policy
    contentSecurityPolicy: isDev
      ? false // Disable in development for easier debugging
      : {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'", 'ws:', 'wss:'],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },

    // Other security headers
    crossOriginEmbedderPolicy: false, // May cause issues with some resources
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: !isDev ? { maxAge: 31536000, includeSubDomains: true } : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  };
}

// WebSocket connection limits
export const wsLimits = {
  maxConnections: 100,           // Max concurrent WebSocket connections
  maxConnectionsPerIp: 10,       // Max connections per IP address
  messageRateLimit: 10,          // Max messages per second per client
  messageRateWindow: 1000,       // Rate limit window in ms
  maxMessageSize: 1024,          // Max incoming message size in bytes
} as const;

// IP tracking for connection limits
export class ConnectionTracker {
  private connectionsByIp = new Map<string, number>();
  private totalConnections = 0;

  canConnect(ip: string): { allowed: boolean; reason?: string } {
    if (this.totalConnections >= wsLimits.maxConnections) {
      return { allowed: false, reason: 'Server connection limit reached' };
    }

    const ipConnections = this.connectionsByIp.get(ip) || 0;
    if (ipConnections >= wsLimits.maxConnectionsPerIp) {
      return { allowed: false, reason: 'Per-IP connection limit reached' };
    }

    return { allowed: true };
  }

  addConnection(ip: string): void {
    const current = this.connectionsByIp.get(ip) || 0;
    this.connectionsByIp.set(ip, current + 1);
    this.totalConnections++;
  }

  removeConnection(ip: string): void {
    const current = this.connectionsByIp.get(ip) || 0;
    if (current > 1) {
      this.connectionsByIp.set(ip, current - 1);
    } else {
      this.connectionsByIp.delete(ip);
    }
    this.totalConnections = Math.max(0, this.totalConnections - 1);
  }

  getStats(): { total: number; byIp: Map<string, number> } {
    return {
      total: this.totalConnections,
      byIp: new Map(this.connectionsByIp),
    };
  }
}

// Message rate limiter for WebSocket
export class MessageRateLimiter {
  private messageCounts = new Map<string, { count: number; resetAt: number }>();

  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const record = this.messageCounts.get(clientId);

    if (!record || now >= record.resetAt) {
      this.messageCounts.set(clientId, {
        count: 1,
        resetAt: now + wsLimits.messageRateWindow,
      });
      return true;
    }

    if (record.count >= wsLimits.messageRateLimit) {
      return false;
    }

    record.count++;
    return true;
  }

  removeClient(clientId: string): void {
    this.messageCounts.delete(clientId);
  }

  // Periodic cleanup of stale entries
  cleanup(): void {
    const now = Date.now();
    for (const [clientId, record] of this.messageCounts) {
      if (now >= record.resetAt) {
        this.messageCounts.delete(clientId);
      }
    }
  }
}

// Singleton instances
export const connectionTracker = new ConnectionTracker();
export const messageRateLimiter = new MessageRateLimiter();
