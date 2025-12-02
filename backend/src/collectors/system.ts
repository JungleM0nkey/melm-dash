import si from 'systeminformation';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
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
 * Detect Linux distribution by parsing /etc/os-release
 */
async function detectDistribution(): Promise<{ distro?: string; distroName?: string }> {
  try {
    const osRelease = await readFile('/etc/os-release', 'utf-8');
    const lines = osRelease.split('\n');

    let distro: string | undefined;
    let distroName: string | undefined;

    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes

      if (key === 'ID') {
        distro = value.toLowerCase();
      } else if (key === 'NAME') {
        distroName = value;
      }
    }

    return { distro, distroName };
  } catch {
    // /etc/os-release not available or not readable
    return {};
  }
}

/**
 * Detect if running inside a container
 */
async function detectContainer(): Promise<{ inContainer?: boolean; containerType?: string }> {
  try {
    // Check for Docker: /.dockerenv file
    try {
      await access('/.dockerenv');
      return { inContainer: true, containerType: 'docker' };
    } catch {
      // Not Docker via /.dockerenv
    }

    // Check for Podman: /run/.containerenv file
    try {
      await access('/run/.containerenv');
      return { inContainer: true, containerType: 'podman' };
    } catch {
      // Not Podman
    }

    // Check /proc/1/cgroup for container indicators
    try {
      const cgroup = await readFile('/proc/1/cgroup', 'utf-8');

      if (cgroup.includes('docker')) {
        return { inContainer: true, containerType: 'docker' };
      } else if (cgroup.includes('lxc')) {
        return { inContainer: true, containerType: 'lxc' };
      } else if (cgroup.includes('containerd')) {
        return { inContainer: true, containerType: 'containerd' };
      } else if (cgroup.includes('kubepods')) {
        return { inContainer: true, containerType: 'kubernetes' };
      }
    } catch {
      // /proc/1/cgroup not available
    }

    // Check environment variable
    if (process.env.container) {
      return { inContainer: true, containerType: process.env.container };
    }

    // No container detected
    return { inContainer: false };
  } catch {
    return {};
  }
}

/**
 * Collect system information
 * Uses execFile instead of exec to prevent command injection
 */
export async function collectSystem(): Promise<SystemInfo> {
  const [osInfo, time, distroInfo, containerInfo] = await Promise.all([
    si.osInfo(),
    si.time(),
    detectDistribution(),
    detectContainer(),
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
    distro: distroInfo.distro,
    distroName: distroInfo.distroName,
    inContainer: containerInfo.inContainer,
    containerType: containerInfo.containerType,
  };
}
