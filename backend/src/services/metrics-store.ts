import { config } from '../config.js';
import { InMemoryMetricsRepository } from '../repositories/index.js';
import type { IMetricsRepository } from '../repositories/index.js';

/**
 * MetricsStore - provides backward-compatible access to metrics repository
 *
 * @deprecated Use IMetricsRepository interface directly via dependency injection
 * This class exists for backward compatibility during migration
 */
export class MetricsStore implements IMetricsRepository {
  private repository: IMetricsRepository;

  constructor(maxPoints = config.history.maxPoints) {
    this.repository = new InMemoryMetricsRepository({ maxPoints });
  }

  // Delegate all methods to repository
  setCpu = this.delegate('setCpu');
  getCpu = this.delegate('getCpu');
  getCpuHistory = this.delegate('getCpuHistory');
  setMemory = this.delegate('setMemory');
  getMemory = this.delegate('getMemory');
  getMemoryHistory = this.delegate('getMemoryHistory');
  setDocker = this.delegate('setDocker');
  getDocker = this.delegate('getDocker');
  setPorts = this.delegate('setPorts');
  getPorts = this.delegate('getPorts');
  setStorage = this.delegate('setStorage');
  getStorage = this.delegate('getStorage');
  setNetwork = this.delegate('setNetwork');
  getNetwork = this.delegate('getNetwork');
  getNetworkHistory = this.delegate('getNetworkHistory');
  setServices = this.delegate('setServices');
  getServices = this.delegate('getServices');
  setSystem = this.delegate('setSystem');
  getSystem = this.delegate('getSystem');
  getSnapshot = this.delegate('getSnapshot');
  getMaxPoints = this.delegate('getMaxPoints');

  private delegate<K extends keyof IMetricsRepository>(method: K): IMetricsRepository[K] {
    return ((...args: unknown[]) => {
      const fn = this.repository[method] as (...args: unknown[]) => unknown;
      return fn.apply(this.repository, args);
    }) as IMetricsRepository[K];
  }
}

// Singleton instance for backward compatibility
export const metricsStore = new MetricsStore();
