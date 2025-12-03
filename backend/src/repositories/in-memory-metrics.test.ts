import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryMetricsRepository } from './in-memory-metrics.js';
import type { CpuMetrics, MemoryMetrics, NetworkMetrics } from '@melm-dash/shared-types';

describe('InMemoryMetricsRepository', () => {
  let repository: InMemoryMetricsRepository;

  beforeEach(() => {
    repository = new InMemoryMetricsRepository({ maxPoints: 60 });
  });

  describe('CPU metrics', () => {
    const mockCpuData: CpuMetrics = {
      usage: 45.5,
      cores: 8,
      physicalCores: 4,
      model: 'Intel Core i7',
      speed: 3.2,
    };

    it('should store and retrieve CPU metrics', () => {
      repository.setCpu(mockCpuData);
      expect(repository.getCpu()).toEqual(mockCpuData);
    });

    it('should add to CPU history when setting metrics', () => {
      repository.setCpu(mockCpuData);
      const history = repository.getCpuHistory();

      expect(history).toHaveLength(1);
      expect(history[0].data).toBe(mockCpuData.usage);
      expect(typeof history[0].timestamp).toBe('number');
    });

    it('should return null when no CPU data set', () => {
      expect(repository.getCpu()).toBeNull();
    });
  });

  describe('Memory metrics', () => {
    const mockMemoryData: MemoryMetrics = {
      usage: 65.2,
      used: 8.5,
      total: 16.0,
      available: 7.5,
    };

    it('should store and retrieve memory metrics', () => {
      repository.setMemory(mockMemoryData);
      expect(repository.getMemory()).toEqual(mockMemoryData);
    });

    it('should add to memory history when setting metrics', () => {
      repository.setMemory(mockMemoryData);
      const history = repository.getMemoryHistory();

      expect(history).toHaveLength(1);
      expect(history[0].data).toBe(mockMemoryData.usage);
    });
  });

  describe('Network metrics', () => {
    const mockNetworkData: NetworkMetrics = {
      download: 10.5,
      upload: 2.3,
      interfaces: [
        { name: 'eth0', ip: '192.168.1.100', mac: 'aa:bb:cc:dd:ee:ff', status: 'up', type: 'wired' },
      ],
    };

    it('should store and retrieve network metrics', () => {
      repository.setNetwork(mockNetworkData);
      expect(repository.getNetwork()).toEqual(mockNetworkData);
    });

    it('should add to network history when setting metrics', () => {
      repository.setNetwork(mockNetworkData);
      const history = repository.getNetworkHistory();

      expect(history).toHaveLength(1);
      expect(history[0].data).toEqual({
        download: mockNetworkData.download,
        upload: mockNetworkData.upload,
      });
    });
  });

  describe('History rolling window', () => {
    it('should maintain max points limit in history', () => {
      const smallRepo = new InMemoryMetricsRepository({ maxPoints: 3 });

      for (let i = 0; i < 5; i++) {
        smallRepo.setCpu({ usage: i * 10, cores: 4, physicalCores: 2, model: 'Test', speed: 2.0 });
      }

      const history = smallRepo.getCpuHistory();
      expect(history).toHaveLength(3);
      // Should have the last 3 values (20, 30, 40)
      expect(history[0].data).toBe(20);
      expect(history[1].data).toBe(30);
      expect(history[2].data).toBe(40);
    });
  });

  describe('Snapshot', () => {
    it('should return complete snapshot with all data', () => {
      const cpuData: CpuMetrics = { usage: 50, cores: 4, physicalCores: 2, model: 'Test CPU', speed: 2.5 };
      const memData: MemoryMetrics = { usage: 60, used: 8, total: 16, available: 8 };

      repository.setCpu(cpuData);
      repository.setMemory(memData);
      repository.setDocker([]);
      repository.setPorts([]);
      repository.setStorage([]);
      repository.setServices([]);

      const snapshot = repository.getSnapshot();

      expect(snapshot.cpu).toEqual(cpuData);
      expect(snapshot.memory).toEqual(memData);
      expect(snapshot.docker).toEqual([]);
      expect(snapshot.ports).toEqual([]);
      expect(snapshot.storage).toEqual([]);
      expect(snapshot.services).toEqual([]);
      expect(snapshot.cpuHistory).toHaveLength(1);
      expect(snapshot.memoryHistory).toHaveLength(1);
    });

    it('should return immutable copies in snapshot', () => {
      repository.setDocker([{ id: '1', name: 'test', image: 'img', status: 'running', uptime: 100, cpu: 5, memory: { usage: 100, limit: 500 } }]);

      const snapshot1 = repository.getSnapshot();
      const snapshot2 = repository.getSnapshot();

      expect(snapshot1.docker).not.toBe(snapshot2.docker);
      expect(snapshot1.docker).toEqual(snapshot2.docker);
    });
  });

  describe('getMaxPoints', () => {
    it('should return configured max points', () => {
      expect(repository.getMaxPoints()).toBe(60);
    });
  });
});
