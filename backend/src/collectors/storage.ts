import si from 'systeminformation';
import type { StorageDrive } from '@melm-dash/shared-types';

/**
 * Collect storage drive metrics
 */
export async function collectStorage(): Promise<StorageDrive[]> {
  const fsSize = await si.fsSize();

  // Filter out snap, boot, and system mounts
  const excluded = ['/boot', '/snap', '/run', '/dev', '/sys', '/proc'];

  return fsSize
    .filter(fs => {
      const mount = fs.mount;
      return (
        fs.size > 0 &&
        !excluded.some(ex => mount.startsWith(ex)) &&
        !mount.includes('/snap/') &&
        fs.type !== 'squashfs'
      );
    })
    .map(fs => ({
      device: fs.fs.split('/').pop() || fs.fs,
      mountPoint: fs.mount,
      filesystem: fs.type,
      total: Math.round(fs.size / (1024 * 1024 * 1024) * 10) / 10, // GB
      used: Math.round(fs.used / (1024 * 1024 * 1024) * 10) / 10,
      available: Math.round((fs.size - fs.used) / (1024 * 1024 * 1024) * 10) / 10,
      usagePercent: Math.round(fs.use * 10) / 10,
    }));
}
