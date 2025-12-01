import { execFile } from 'child_process';
import { promisify } from 'util';
import { config } from '../config.js';
import type { SystemService } from '@melm-dash/shared-types';

const execFileAsync = promisify(execFile);

/**
 * Safely validate service name to prevent injection
 */
function isValidServiceName(name: string): boolean {
  // Service names should only contain alphanumeric, dash, underscore, @, and dot
  return /^[a-zA-Z0-9_@.-]+$/.test(name);
}

/**
 * Collect systemd service status
 * Uses execFile instead of exec to prevent command injection
 */
export async function collectServices(): Promise<SystemService[]> {
  const results: SystemService[] = [];

  for (const serviceName of config.monitoredServices) {
    // Validate service name before using in command
    if (!isValidServiceName(serviceName)) {
      results.push({
        name: serviceName,
        status: 'unknown',
      });
      continue;
    }

    try {
      // Use execFile with argument array - no shell interpretation
      const { stdout } = await execFileAsync('systemctl', ['is-active', serviceName]);
      const status = stdout.trim();

      let uptime: number | undefined;
      if (status === 'active') {
        try {
          const { stdout: uptimeOut } = await execFileAsync('systemctl', [
            'show',
            serviceName,
            '--property=ActiveEnterTimestamp',
            '--value',
          ]);
          const timestamp = new Date(uptimeOut.trim()).getTime();
          if (!isNaN(timestamp)) {
            uptime = Date.now() - timestamp;
          }
        } catch {
          // Ignore uptime errors
        }
      }

      results.push({
        name: serviceName,
        status: status === 'active' ? 'running' : status === 'failed' ? 'failed' : 'stopped',
        uptime,
      });
    } catch {
      // execFile throws if command fails (e.g., service inactive)
      // Check status with a separate call
      try {
        const { stdout } = await execFileAsync('systemctl', ['is-failed', serviceName]);
        const isFailed = stdout.trim() === 'failed';
        results.push({
          name: serviceName,
          status: isFailed ? 'failed' : 'stopped',
        });
      } catch {
        results.push({
          name: serviceName,
          status: 'stopped',
        });
      }
    }
  }

  return results;
}
