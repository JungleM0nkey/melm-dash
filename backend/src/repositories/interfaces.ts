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

/**
 * Repository interface for metrics storage
 * Abstracts the storage layer for better testability and future flexibility
 */
export interface IMetricsRepository {
  // CPU
  setCpu(data: CpuMetrics): void;
  getCpu(): CpuMetrics | null;
  getCpuHistory(): TimeSeriesPoint<number>[];

  // Memory
  setMemory(data: MemoryMetrics): void;
  getMemory(): MemoryMetrics | null;
  getMemoryHistory(): TimeSeriesPoint<number>[];

  // Docker
  setDocker(data: DockerContainer[]): void;
  getDocker(): DockerContainer[];

  // Ports
  setPorts(data: ListeningPort[]): void;
  getPorts(): ListeningPort[];

  // Storage
  setStorage(data: StorageDrive[]): void;
  getStorage(): StorageDrive[];

  // Network
  setNetwork(data: NetworkMetrics): void;
  getNetwork(): NetworkMetrics | null;
  getNetworkHistory(): TimeSeriesPoint<{ download: number; upload: number }>[];

  // Services
  setServices(data: SystemService[]): void;
  getServices(): SystemService[];

  // System
  setSystem(data: SystemInfo): void;
  getSystem(): SystemInfo | null;

  // Snapshot
  getSnapshot(): MetricsSnapshot;

  // Configuration
  getMaxPoints(): number;
}

/**
 * Configuration for metrics repository
 */
export interface MetricsRepositoryConfig {
  maxPoints: number;
}
