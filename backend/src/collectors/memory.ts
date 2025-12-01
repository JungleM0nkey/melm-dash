import si from 'systeminformation';
import type { MemoryMetrics } from '@melm-dash/shared-types';

/**
 * Collect memory metrics
 */
export async function collectMemory(): Promise<MemoryMetrics> {
  const mem = await si.mem();

  const usedGb = mem.used / (1024 * 1024 * 1024);
  const totalGb = mem.total / (1024 * 1024 * 1024);
  const availableGb = mem.available / (1024 * 1024 * 1024);
  const usage = (mem.used / mem.total) * 100;

  return {
    usage: Math.round(usage * 10) / 10,
    used: Math.round(usedGb * 10) / 10,
    total: Math.round(totalGb * 10) / 10,
    available: Math.round(availableGb * 10) / 10,
  };
}
