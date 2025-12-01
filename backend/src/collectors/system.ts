import si from 'systeminformation';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { SystemInfo } from '@melm-dash/shared-types';

const execFileAsync = promisify(execFile);

/**
 * Count lines in output (replaces shell pipe to wc -l)
 */
function countLines(output: string): number {
  if (!output.trim()) return 0;
  return output.trim().split('\n').length;
}

/**
 * Try to get package count using NixOS nix-store
 */
async function getNixPackageCount(): Promise<number> {
  const { stdout } = await execFileAsync('nix-store', [
    '-q',
    '--requisites',
    '/run/current-system',
  ]);
  return countLines(stdout);
}

/**
 * Try to get package count using dpkg (Debian/Ubuntu)
 */
async function getDpkgPackageCount(): Promise<number> {
  const { stdout } = await execFileAsync('dpkg', ['-l']);
  // dpkg -l includes header lines, subtract them
  const lines = countLines(stdout);
  return lines > 5 ? lines - 5 : 0;
}

/**
 * Try to get package count using rpm (RHEL/Fedora)
 */
async function getRpmPackageCount(): Promise<number> {
  const { stdout } = await execFileAsync('rpm', ['-qa']);
  return countLines(stdout);
}

/**
 * Collect system information
 * Uses execFile instead of exec to prevent command injection
 */
export async function collectSystem(): Promise<SystemInfo> {
  const [osInfo, time] = await Promise.all([
    si.osInfo(),
    si.time(),
  ]);

  // Try to get package count from various package managers
  let packages = 0;
  try {
    packages = await getNixPackageCount();
  } catch {
    // Not NixOS or nix-store not available
    try {
      packages = await getDpkgPackageCount();
    } catch {
      try {
        packages = await getRpmPackageCount();
      } catch {
        // No supported package manager found
      }
    }
  }

  return {
    hostname: osInfo.hostname,
    os: `${osInfo.distro} ${osInfo.release}`,
    kernel: `Linux ${osInfo.kernel}`,
    uptime: time.uptime,
    packages,
    location: 'Local', // Could be enhanced with GeoIP
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currentTime: new Date().toISOString(),
  };
}
