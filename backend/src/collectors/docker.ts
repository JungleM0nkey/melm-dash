import si from 'systeminformation';
import type { DockerContainer } from '@melm-dash/shared-types';

/**
 * Collect Docker container metrics
 */
export async function collectDocker(): Promise<DockerContainer[]> {
  try {
    const [containers, stats] = await Promise.all([
      si.dockerContainers(true), // true = all containers
      si.dockerContainerStats('*'),
    ]);

    const statsMap = new Map(stats.map(s => [s.id, s]));

    return containers.map(c => {
      const s = statsMap.get(c.id);
      const isRunning = c.state === 'running';

      return {
        id: c.id,
        name: c.name.replace(/^\//, ''), // Remove leading slash
        image: c.image,
        status: c.state as DockerContainer['status'],
        uptime: isRunning ? c.started : 0,
        cpu: s ? Math.round(s.cpuPercent * 10) / 10 : 0,
        memory: {
          usage: s ? s.memUsage : 0,
          limit: s ? s.memLimit : 0,
        },
      };
    });
  } catch (error) {
    // Docker may not be available
    console.warn('Docker collection failed:', error);
    return [];
  }
}
