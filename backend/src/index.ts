import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { scheduler } from './services/scheduler.js';
import { wsRoutes } from './routes/ws.js';
import { apiRoutes } from './routes/api.js';
import { logger, serverLogger } from './lib/logger.js';
import {
  getCorsConfig,
  getRateLimitConfig,
  getHelmetConfig,
  messageRateLimiter,
} from './lib/security.js';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const fastify = Fastify({
    // Fastify 5.x: use loggerInstance for custom pino loggers
    loggerInstance: logger,
    // Trust proxy for accurate IP detection behind reverse proxies
    trustProxy: true,
  });

  // Security headers (register first for all routes)
  await fastify.register(helmet, getHelmetConfig());

  // CORS configuration
  await fastify.register(cors, getCorsConfig());

  // Rate limiting for API endpoints
  await fastify.register(rateLimit, getRateLimitConfig());

  // Static file serving for frontend (production only)
  const frontendDistPath = path.join(__dirname, '../frontend-dist');
  const isDevelopment = config.env.nodeEnv === 'development';
  const hasFrontendDist = existsSync(frontendDistPath);

  if (hasFrontendDist) {
    await fastify.register(fastifyStatic, {
      root: frontendDistPath,
      prefix: '/',
      decorateReply: true,
    });
  }

  // WebSocket support
  await fastify.register(websocket, {
    options: {
      maxPayload: config.websocket.maxPayload,
    },
  });

  // Register routes
  await fastify.register(apiRoutes);
  await fastify.register(wsRoutes);

  // SPA fallback - serve index.html for non-API routes (production only)
  if (hasFrontendDist) {
    fastify.setNotFoundHandler((request, reply) => {
      if (!request.url.startsWith('/api') && !request.url.startsWith('/ws')) {
        return reply.sendFile('index.html');
      }
      reply.status(404).send({ error: 'Not Found' });
    });
  } else if (isDevelopment) {
    // Development mode: provide helpful info at root
    fastify.get('/', async () => ({
      message: 'melm-dash backend running in development mode',
      frontend: 'Access the dashboard at http://localhost:5173',
      endpoints: {
        health: '/health',
        api: '/api/*',
        websocket: '/ws',
      },
    }));
  }

  // Graceful shutdown
  let isShuttingDown = false;
  let rateLimiterCleanupInterval: NodeJS.Timeout | null = null;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    serverLogger.info({ signal }, 'Shutdown signal received');

    try {
      // Clear cleanup interval
      if (rateLimiterCleanupInterval) {
        clearInterval(rateLimiterCleanupInterval);
      }
      scheduler.stop();
      await fastify.close();
      serverLogger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      serverLogger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    serverLogger.fatal({ error }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    serverLogger.error({ reason }, 'Unhandled rejection');
  });

  // Periodic cleanup of rate limiter stale entries
  rateLimiterCleanupInterval = setInterval(() => {
    messageRateLimiter.cleanup();
  }, 60000); // Every minute

  try {
    // Start the scheduler
    await scheduler.start();

    // Start the server
    await fastify.listen({
      host: config.server.host,
      port: config.server.port,
    });

    serverLogger.info({
      host: config.server.host,
      port: config.server.port,
      env: config.env.nodeEnv,
    }, 'Server started');
  } catch (error) {
    if (rateLimiterCleanupInterval) {
      clearInterval(rateLimiterCleanupInterval);
    }
    serverLogger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

main();
