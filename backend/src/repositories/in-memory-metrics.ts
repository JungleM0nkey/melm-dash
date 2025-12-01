import type {
  CpuMetrics,
  MemoryMetrics,
  DockerContainer,
  ListeningPort,
  StorageDrive,
  NetworkMetrics,
  SystemService,
  SystemInfo,
  TimeSeriesPoint,
  MetricsSnapshot,
} from '@melm-dash/shared-types';
import type { IMetricsRepository, MetricsRepositoryConfig } from './interfaces.js';

/**
 * In-memory implementation of metrics repository
 * Stores metrics with a rolling window for historical data
 */
export class InMemoryMetricsRepository implements IMetricsRepository {
  private readonly maxPoints: number;

  // Current values
  private cpu: CpuMetrics | null = null;
  private memory: MemoryMetrics | null = null;
  private docker: DockerContainer[] = [];
  private ports: ListeningPort[] = [];
  private storage: StorageDrive[] = [];
  private network: NetworkMetrics | null = null;
  private services: SystemService[] = [];
  private system: SystemInfo | null = null;

  // Historical data for charts
  private cpuHistory: TimeSeriesPoint<number>[] = [];
  private memoryHistory: TimeSeriesPoint<number>[] = [];
  private networkHistory: TimeSeriesPoint<{ download: number; upload: number }>[] = [];

  constructor(config: MetricsRepositoryConfig) {
    this.maxPoints = config.maxPoints;
  }

  // CPU
  setCpu(data: CpuMetrics): void {
    this.cpu = data;
    this.addToHistory(this.cpuHistory, data.usage);
  }

  getCpu(): CpuMetrics | null {
    return this.cpu;
  }

  getCpuHistory(): TimeSeriesPoint<number>[] {
    return [...this.cpuHistory];
  }

  // Memory
  setMemory(data: MemoryMetrics): void {
    this.memory = data;
    this.addToHistory(this.memoryHistory, data.usage);
  }

  getMemory(): MemoryMetrics | null {
    return this.memory;
  }

  getMemoryHistory(): TimeSeriesPoint<number>[] {
    return [...this.memoryHistory];
  }

  // Docker
  setDocker(data: DockerContainer[]): void {
    this.docker = data;
  }

  getDocker(): DockerContainer[] {
    return [...this.docker];
  }

  // Ports
  setPorts(data: ListeningPort[]): void {
    this.ports = data;
  }

  getPorts(): ListeningPort[] {
    return [...this.ports];
  }

  // Storage
  setStorage(data: StorageDrive[]): void {
    this.storage = data;
  }

  getStorage(): StorageDrive[] {
    return [...this.storage];
  }

  // Network
  setNetwork(data: NetworkMetrics): void {
    this.network = data;
    this.addToHistory(this.networkHistory, {
      download: data.download,
      upload: data.upload,
    });
  }

  getNetwork(): NetworkMetrics | null {
    return this.network;
  }

  getNetworkHistory(): TimeSeriesPoint<{ download: number; upload: number }>[] {
    return [...this.networkHistory];
  }

  // Services
  setServices(data: SystemService[]): void {
    this.services = data;
  }

  getServices(): SystemService[] {
    return [...this.services];
  }

  // System info
  setSystem(data: SystemInfo): void {
    this.system = data;
  }

  getSystem(): SystemInfo | null {
    return this.system;
  }

  // Get full snapshot for initial WebSocket connection
  getSnapshot(): MetricsSnapshot {
    return {
      cpu: this.cpu,
      memory: this.memory,
      docker: [...this.docker],
      ports: [...this.ports],
      storage: [...this.storage],
      network: this.network,
      services: [...this.services],
      system: this.system,
      cpuHistory: [...this.cpuHistory],
      memoryHistory: [...this.memoryHistory],
      networkHistory: [...this.networkHistory],
    };
  }

  getMaxPoints(): number {
    return this.maxPoints;
  }

  // Helper to add data to history with rolling window
  private addToHistory<T>(history: TimeSeriesPoint<T>[], data: T): void {
    history.push({
      timestamp: Date.now(),
      data,
    });

    // Trim to max points
    if (history.length > this.maxPoints) {
      history.shift();
    }
  }
}
