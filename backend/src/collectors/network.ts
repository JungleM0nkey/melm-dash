import si from 'systeminformation';
import type { NetworkMetrics, NetworkInterface } from '@melm-dash/shared-types';

/**
 * Collect network metrics
 */
export async function collectNetwork(): Promise<NetworkMetrics> {
  const [netStats, netInterfaces] = await Promise.all([
    si.networkStats(),
    si.networkInterfaces(),
  ]);

  // Calculate total bandwidth from all interfaces
  let totalDownload = 0;
  let totalUpload = 0;

  for (const stat of netStats) {
    totalDownload += stat.rx_sec || 0;
    totalUpload += stat.tx_sec || 0;
  }

  // Convert to Mbps
  const downloadMbps = (totalDownload * 8) / (1024 * 1024);
  const uploadMbps = (totalUpload * 8) / (1024 * 1024);

  // Map interfaces
  const interfaces: NetworkInterface[] = (Array.isArray(netInterfaces) ? netInterfaces : [netInterfaces])
    .filter((iface): iface is si.Systeminformation.NetworkInterfacesData =>
      iface !== null && typeof iface === 'object' && 'iface' in iface
    )
    .filter(iface => !iface.virtual && iface.iface !== 'lo')
    .map(iface => ({
      name: iface.iface,
      ip: iface.ip4 || '-',
      mac: iface.mac,
      status: iface.operstate === 'up' ? 'up' : 'down',
      type: iface.type || 'unknown',
    }));

  return {
    download: Math.round(downloadMbps * 10) / 10,
    upload: Math.round(uploadMbps * 10) / 10,
    interfaces,
  };
}
