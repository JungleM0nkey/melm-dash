import { config } from '../config.js';
import { InMemoryMetricsRepository, type IMetricsRepository } from '../repositories/index.js';
import { BroadcastManager } from '../services/broadcast.js';

/**
 * Service identifiers for the DI container
 */
export const SERVICES = {
  MetricsRepository: Symbol.for('MetricsRepository'),
  BroadcastManager: Symbol.for('BroadcastManager'),
  Config: Symbol.for('Config'),
} as const;

/**
 * Service types mapping
 */
export interface ServiceTypes {
  [SERVICES.MetricsRepository]: IMetricsRepository;
  [SERVICES.BroadcastManager]: BroadcastManager;
  [SERVICES.Config]: typeof config;
}

type ServiceKey = keyof ServiceTypes;
type ServiceFactory<T> = () => T;

/**
 * Simple dependency injection container
 * Supports singleton and factory registrations
 */
class Container {
  private singletons = new Map<symbol, unknown>();
  private factories = new Map<symbol, ServiceFactory<unknown>>();

  /**
   * Register a singleton instance
   */
  registerSingleton<K extends ServiceKey>(
    key: K,
    instance: ServiceTypes[K]
  ): void {
    this.singletons.set(key, instance);
  }

  /**
   * Register a factory function for lazy instantiation
   */
  registerFactory<K extends ServiceKey>(
    key: K,
    factory: ServiceFactory<ServiceTypes[K]>
  ): void {
    this.factories.set(key, factory as ServiceFactory<unknown>);
  }

  /**
   * Resolve a service by its key
   */
  resolve<K extends ServiceKey>(key: K): ServiceTypes[K] {
    // Check for singleton
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as ServiceTypes[K];
    }

    // Check for factory
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();
      // Cache as singleton after first resolution
      this.singletons.set(key, instance);
      return instance as ServiceTypes[K];
    }

    throw new Error(`Service not registered: ${String(key)}`);
  }

  /**
   * Check if a service is registered
   */
  has(key: ServiceKey): boolean {
    return this.singletons.has(key) || this.factories.has(key);
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.singletons.clear();
    this.factories.clear();
  }
}

/**
 * Create and configure the default container
 */
export function createContainer(): Container {
  const container = new Container();

  // Register config
  container.registerSingleton(SERVICES.Config, config);

  // Register metrics repository
  container.registerFactory(SERVICES.MetricsRepository, () =>
    new InMemoryMetricsRepository({ maxPoints: config.history.maxPoints })
  );

  // Register broadcast manager
  container.registerFactory(SERVICES.BroadcastManager, () =>
    new BroadcastManager()
  );

  return container;
}

// Default container instance
export const container = createContainer();

// Re-export for convenience
export type { IMetricsRepository } from '../repositories/index.js';
export { BroadcastManager } from '../services/broadcast.js';
