import type { FastifyInstance } from 'fastify';
import { broadcastManager } from '../services/broadcast.js';
import { metricsStore } from '../services/metrics-store.js';
import { wsLogger } from '../lib/logger.js';
import { validateWsMessage, sanitizeForLog } from '../lib/validation.js';
import {
  connectionTracker,
  messageRateLimiter,
  wsLimits,
} from '../lib/security.js';

export async function wsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const clientIp = req.ip || 'unknown';
    const clientId = `${clientIp}:${Date.now()}`;

    // Check connection limits before accepting
    const canConnect = connectionTracker.canConnect(clientIp);
    if (!canConnect.allowed) {
      wsLogger.warn({ clientIp, reason: canConnect.reason }, 'Connection rejected');
      socket.close(1013, canConnect.reason); // 1013 = Try Again Later
      return;
    }

    // Track the connection
    connectionTracker.addConnection(clientIp);
    wsLogger.info({ clientId, totalConnections: connectionTracker.getStats().total }, 'Client connected');

    // Add client to broadcast manager
    broadcastManager.addClient(socket);

    // Send initial snapshot
    const snapshot = metricsStore.getSnapshot();
    broadcastManager.send(socket, 'initial', snapshot);

    // Handle incoming messages with validation and rate limiting
    socket.on('message', (data) => {
      // Rate limit check
      if (!messageRateLimiter.isAllowed(clientId)) {
        wsLogger.warn({ clientId }, 'Rate limit exceeded');
        broadcastManager.send(socket, 'error', {
          code: 'RATE_LIMITED',
          message: 'Too many messages. Please slow down.',
        });
        return;
      }

      // Size check
      const rawData = data.toString();
      if (rawData.length > wsLimits.maxMessageSize) {
        wsLogger.warn({ clientId, size: rawData.length }, 'Message too large');
        broadcastManager.send(socket, 'error', {
          code: 'MESSAGE_TOO_LARGE',
          message: 'Message exceeds size limit',
        });
        return;
      }

      // Validate message
      const validation = validateWsMessage(rawData);
      if (!validation.success) {
        wsLogger.warn(
          { clientId, error: validation.error, preview: sanitizeForLog(rawData, 50) },
          'Invalid message'
        );
        broadcastManager.send(socket, 'error', {
          code: 'INVALID_MESSAGE',
          message: validation.error,
        });
        return;
      }

      const message = validation.data!;

      // Handle valid message types
      switch (message.type) {
        case 'ping':
          broadcastManager.send(socket, 'pong', { timestamp: Date.now() });
          break;

        case 'subscribe':
        case 'unsubscribe':
          // Future: handle subscription management
          wsLogger.debug({ clientId, type: message.type }, 'Subscription message');
          break;

        default:
          // This shouldn't happen due to zod validation, but handle gracefully
          wsLogger.warn({ clientId, type: message.type }, 'Unhandled message type');
      }
    });

    socket.on('close', (code, reason) => {
      connectionTracker.removeConnection(clientIp);
      messageRateLimiter.removeClient(clientId);
      wsLogger.info(
        { clientId, code, reason: reason.toString(), totalConnections: connectionTracker.getStats().total },
        'Client disconnected'
      );
      broadcastManager.removeClient(socket);
    });

    socket.on('error', (error) => {
      connectionTracker.removeConnection(clientIp);
      messageRateLimiter.removeClient(clientId);
      wsLogger.error({ error, clientId }, 'Connection error');
      broadcastManager.removeClient(socket);
    });
  });
}
