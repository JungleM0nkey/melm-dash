import { env } from './lib/env.js';

// Backend configuration (validated from environment)
export const config = {
  server: {
    host: env.HOST,
    port: env.PORT,
  },

  // Polling intervals in milliseconds
  intervals: {
    cpu: env.INTERVAL_CPU,
    memory: env.INTERVAL_MEMORY,
    network: env.INTERVAL_NETWORK,
    docker: env.INTERVAL_DOCKER,
    storage: env.INTERVAL_STORAGE,
    services: env.INTERVAL_SERVICES,
    ports: env.INTERVAL_PORTS,
    system: env.INTERVAL_SYSTEM,
  },

  // Rolling window for historical data
  history: {
    maxPoints: env.HISTORY_MAX_POINTS,
  },

  // WebSocket configuration
  websocket: {
    maxPayload: env.WS_MAX_PAYLOAD,
  },

  // Services to monitor (could be extended to env var later)
  monitoredServices: [
    'sshd',
    'nginx',
    'docker',
    'postgresql',
    'redis',
    'systemd-resolved',
    'firewalld',
    'acpid',
  ],

  // Environment info
  env: {
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
  },
} as const;
