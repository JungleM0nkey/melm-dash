import si from 'systeminformation';
import type { CpuMetrics } from '@melm-dash/shared-types';

/**
 * Collect CPU metrics
 */
export async function collectCpu(): Promise<CpuMetrics> {
  const [load, cpuInfo] = await Promise.all([
    si.currentLoad(),
    si.cpu(),
  ]);

  return {
    usage: Math.round(load.currentLoad * 10) / 10,
    cores: cpuInfo.cores,
    model: `${cpuInfo.manufacturer} ${cpuInfo.brand}`,
    speed: cpuInfo.speed,
  };
}
