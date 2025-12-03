/**
 * Shared formatting utilities for the dashboard
 */

/**
 * Format bytes to human-readable string with automatic unit scaling
 * @param bytes - Number of bytes
 * @param suffix - Optional suffix (default: empty, use '/s' for rates)
 * @returns Formatted string like "1.5 GB" or "256 KB/s"
 */
export function formatBytes(bytes: number, suffix: string = ''): string {
  if (bytes === 0) return `0 B${suffix}`;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1
  );
  const value = bytes / Math.pow(k, i);
  return `${parseFloat(value.toFixed(1))} ${sizes[i]}${suffix}`;
}

/**
 * Format bytes per second to human-readable speed string
 * @param bytesPerSec - Bytes per second
 * @returns Formatted string like "1.5 MB/s"
 */
export function formatSpeed(bytesPerSec: number): string {
  return formatBytes(bytesPerSec, '/s');
}

/**
 * Format a value already in GB to human-readable string
 * Handles TB conversion for values >= 1024 GB
 * @param gb - Value in gigabytes
 * @returns Formatted string like "256.5 GB" or "1.5 TB"
 */
export function formatGB(gb: number): string {
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}

/**
 * Format uptime in seconds to human-readable duration
 * @param seconds - Duration in seconds
 * @param compact - If true, returns shorter format (default: false)
 * @returns Formatted string like "2d 5h 30m" or "5h 30m"
 */
export function formatUptime(seconds: number | undefined, compact: boolean = false): string {
  if (!seconds) return compact ? '' : '0m';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (compact) {
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
}

/**
 * Format memory bytes to human-readable string (MB/GB)
 * @param bytes - Memory in bytes
 * @returns Formatted string like "512 MB" or "2.5 GB"
 */
export function formatMemory(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}
