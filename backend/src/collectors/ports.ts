import { execFile } from 'child_process';
import { promisify } from 'util';
import type { ListeningPort } from '@melm-dash/shared-types';
import { collectorLogger } from '../lib/logger.js';

const execFileAsync = promisify(execFile);

// Map common ports to service names
function getServiceName(port: number): string {
  const services: Record<number, string> = {
    22: 'SSH',
    80: 'HTTP',
    443: 'HTTPS',
    3000: 'Dev Server',
    3001: 'API Server',
    5432: 'PostgreSQL',
    6379: 'Redis',
    8080: 'HTTP Alt',
    8443: 'HTTPS Alt',
    27017: 'MongoDB',
    3306: 'MySQL',
  };
  return services[port] || `Port ${port}`;
}

/**
 * Collect listening ports using ss command
 * Uses execFile instead of exec to prevent command injection
 */
export async function collectPorts(): Promise<ListeningPort[]> {
  try {
    // Try ss with process info first, fall back to without
    let stdout: string;
    try {
      const result = await execFileAsync('ss', ['-tlnp']);
      stdout = result.stdout;
    } catch {
      // Fall back to ss without process info (doesn't require root)
      const result = await execFileAsync('ss', ['-tln']);
      stdout = result.stdout;
    }

    const lines = stdout.split('\n').slice(1); // Skip header

    const ports: ListeningPort[] = [];
    const seenPorts = new Set<number>();

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split(/\s+/);
      const localAddr = parts[3] || '';

      // Extract port from address (e.g., "*:22" or "0.0.0.0:80" or ":::22")
      const portMatch = localAddr.match(/:(\d+)$/);
      if (!portMatch) continue;

      const port = parseInt(portMatch[1], 10);
      if (seenPorts.has(port)) continue;
      seenPorts.add(port);

      // Try to extract process name from the users column
      const usersMatch = line.match(/users:\(\("([^"]+)"/);
      const process = usersMatch ? usersMatch[1] : getServiceName(port);

      ports.push({
        port,
        protocol: 'tcp',
        service: getServiceName(port),
        process,
      });
    }

    return ports.sort((a, b) => a.port - b.port);
  } catch (error) {
    collectorLogger.warn({ error }, 'Port collection failed');
    return [];
  }
}
