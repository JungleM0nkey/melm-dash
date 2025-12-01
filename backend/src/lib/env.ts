import { z } from 'zod';
import { serverLogger } from './logger.js';

// Environment schema
const envSchema = z.object({
  // Server config
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Collection intervals (milliseconds)
  INTERVAL_CPU: z.coerce.number().int().min(500).default(2000),
  INTERVAL_MEMORY: z.coerce.number().int().min(500).default(3000),
  INTERVAL_NETWORK: z.coerce.number().int().min(500).default(2000),
  INTERVAL_DOCKER: z.coerce.number().int().min(1000).default(5000),
  INTERVAL_STORAGE: z.coerce.number().int().min(5000).default(30000),
  INTERVAL_SERVICES: z.coerce.number().int().min(1000).default(10000),
  INTERVAL_PORTS: z.coerce.number().int().min(1000).default(10000),
  INTERVAL_SYSTEM: z.coerce.number().int().min(10000).default(60000),

  // History config
  HISTORY_MAX_POINTS: z.coerce.number().int().min(10).max(10000).default(300),

  // WebSocket config
  WS_MAX_PAYLOAD: z.coerce.number().int().min(1024).default(1024 * 1024),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    serverLogger.fatal({ errors: formatted }, 'Invalid environment configuration');
    console.error('Environment validation failed:');
    for (const [key, value] of Object.entries(formatted)) {
      if (key !== '_errors' && value && typeof value === 'object' && '_errors' in value) {
        const errors = value._errors as string[];
        if (errors.length > 0) {
          console.error(`  ${key}: ${errors.join(', ')}`);
        }
      }
    }
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
