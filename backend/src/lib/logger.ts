import pino from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerConfig {
  level: LogLevel;
  pretty: boolean;
  name?: string;
}

// Read directly from process.env to avoid circular dependency with env.ts
const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const isPretty = process.env.NODE_ENV !== 'production';

const defaultConfig: LoggerConfig = {
  level: logLevel,
  pretty: isPretty,
  name: 'melm-dash',
};

function createLogger(config: Partial<LoggerConfig> = {}): pino.Logger {
  const mergedConfig = { ...defaultConfig, ...config };

  const options: pino.LoggerOptions = {
    name: mergedConfig.name,
    level: mergedConfig.level,
  };

  if (mergedConfig.pretty) {
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino(options);
}

// Main application logger
export const logger = createLogger();

// Create child loggers for different modules
export function createChildLogger(module: string): pino.Logger {
  return logger.child({ module });
}

// Specific module loggers
export const serverLogger = createChildLogger('server');
export const wsLogger = createChildLogger('websocket');
export const collectorLogger = createChildLogger('collector');
export const metricsLogger = createChildLogger('metrics');

export { pino };
