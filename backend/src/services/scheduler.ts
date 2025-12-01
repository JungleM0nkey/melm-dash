import { config } from '../config.js';
import { metricsStore } from './metrics-store.js';
import { broadcastManager } from './broadcast.js';
import {
  collectCpu,
  collectMemory,
  collectDocker,
  collectPorts,
  collectStorage,
  collectNetwork,
  collectServices,
  collectSystem,
} from '../collectors/index.js';
import { collectorLogger } from '../lib/logger.js';

interface ScheduledTask {
  name: string;
  interval: number;
  timer: NodeJS.Timeout | null;
  collect: () => Promise<void>;
}

/**
 * Orchestrates metric collection at specified intervals
 */
export class Scheduler {
  private tasks: ScheduledTask[] = [];
  private isRunning = false;

  constructor() {
    this.tasks = [
      {
        name: 'cpu',
        interval: config.intervals.cpu,
        timer: null,
        collect: async () => {
          try {
            const data = await collectCpu();
            metricsStore.setCpu(data);
            broadcastManager.broadcast('cpu', {
              ...data,
              history: metricsStore.getCpuHistory(),
            });
          } catch (error) {
            collectorLogger.error({ error, collector: 'cpu' }, 'Collection failed');
          }
        },
      },
      {
        name: 'memory',
        interval: config.intervals.memory,
        timer: null,
        collect: async () => {
          try {
            const data = await collectMemory();
            metricsStore.setMemory(data);
            broadcastManager.broadcast('memory', {
              ...data,
              history: metricsStore.getMemoryHistory(),
            });
          } catch (error) {
            collectorLogger.error({ error, collector: 'memory' }, 'Collection failed');
          }
        },
      },
      {
        name: 'docker',
        interval: config.intervals.docker,
        timer: null,
        collect: async () => {
          try {
            const data = await collectDocker();
            metricsStore.setDocker(data);
            broadcastManager.broadcast('docker', data);
          } catch (error) {
            collectorLogger.error({ error, collector: 'docker' }, 'Collection failed');
          }
        },
      },
      {
        name: 'ports',
        interval: config.intervals.ports,
        timer: null,
        collect: async () => {
          try {
            const data = await collectPorts();
            metricsStore.setPorts(data);
            broadcastManager.broadcast('ports', data);
          } catch (error) {
            collectorLogger.error({ error, collector: 'ports' }, 'Collection failed');
          }
        },
      },
      {
        name: 'storage',
        interval: config.intervals.storage,
        timer: null,
        collect: async () => {
          try {
            const data = await collectStorage();
            metricsStore.setStorage(data);
            broadcastManager.broadcast('storage', data);
          } catch (error) {
            collectorLogger.error({ error, collector: 'storage' }, 'Collection failed');
          }
        },
      },
      {
        name: 'network',
        interval: config.intervals.network,
        timer: null,
        collect: async () => {
          try {
            const data = await collectNetwork();
            metricsStore.setNetwork(data);
            broadcastManager.broadcast('network', {
              ...data,
              history: metricsStore.getNetworkHistory(),
            });
          } catch (error) {
            collectorLogger.error({ error, collector: 'network' }, 'Collection failed');
          }
        },
      },
      {
        name: 'services',
        interval: config.intervals.services,
        timer: null,
        collect: async () => {
          try {
            const data = await collectServices();
            metricsStore.setServices(data);
            broadcastManager.broadcast('services', data);
          } catch (error) {
            collectorLogger.error({ error, collector: 'services' }, 'Collection failed');
          }
        },
      },
      {
        name: 'system',
        interval: config.intervals.system,
        timer: null,
        collect: async () => {
          try {
            const data = await collectSystem();
            metricsStore.setSystem(data);
            broadcastManager.broadcast('system', data);
          } catch (error) {
            collectorLogger.error({ error, collector: 'system' }, 'Collection failed');
          }
        },
      },
    ];
  }

  /**
   * Run initial collection for all metrics
   */
  async collectAll(): Promise<void> {
    collectorLogger.info('Running initial collection');
    const results = await Promise.allSettled(this.tasks.map(task => task.collect()));
    const failed = results.filter(r => r.status === 'rejected').length;
    collectorLogger.info({ total: this.tasks.length, failed }, 'Initial collection complete');
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    // Run initial collection
    await this.collectAll();

    // Start interval timers
    for (const task of this.tasks) {
      task.timer = setInterval(() => {
        task.collect();
      }, task.interval);
    }

    this.isRunning = true;
    collectorLogger.info({ taskCount: this.tasks.length }, 'Scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    for (const task of this.tasks) {
      if (task.timer) {
        clearInterval(task.timer);
        task.timer = null;
      }
    }

    this.isRunning = false;
    collectorLogger.info('Scheduler stopped');
  }
}

// Singleton instance
export const scheduler = new Scheduler();
