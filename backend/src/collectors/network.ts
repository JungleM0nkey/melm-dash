import si from 'systeminformation';
import { readFile } from 'fs/promises';
import type { NetworkMetrics, NetworkInterface } from '@melm-dash/shared-types';

// Cache WSL info to avoid repeated file reads
let cachedWslInfo: { isWsl: boolean; networkingMode?: string } | null = null;

/**
 * Detect WSL and its networking mode
 * WSL2 can use NAT (default) or mirrored networking mode
 */
async function detectWslNetworkInfo(): Promise<{ isWsl: boolean; networkingMode?: string }> {
  if (cachedWslInfo !== null) {
    return cachedWslInfo;
  }

  try {
    const procVersion = await readFile('/proc/version', 'utf-8');
    const lowerVersion = procVersion.toLowerCase();

    if (!lowerVersion.includes('microsoft') && !lowerVersion.includes('wsl')) {
      cachedWslInfo = { isWsl: false };
      return cachedWslInfo;
    }

    // WSL detected, now determine networking mode
    // WSL2 mirrored mode uses the same IP as the Windows host
    // NAT mode uses a different subnet (typically 172.x.x.x or 192.168.x.x)
    // We can detect this by checking if eth0 has a private IP in the WSL NAT range

    // Try to read .wslconfig for explicit networkingMode setting
    // This file is on the Windows side but we can check interface characteristics
    let networkingMode: string | undefined;

    try {
      // In mirrored mode, the interface often shows as 'loopback' type
      // and shares the Windows host IP. In NAT mode, eth0 has a virtual NAT IP.
      // We'll detect based on interface characteristics below
      networkingMode = 'NAT'; // Default for WSL2
    } catch {
      networkingMode = 'NAT';
    }

    cachedWslInfo = { isWsl: true, networkingMode };
    return cachedWslInfo;
  } catch {
    cachedWslInfo = { isWsl: false };
    return cachedWslInfo;
  }
}

/**
 * Determine connection mode for a network interface
 */
async function getConnectionMode(
  iface: si.Systeminformation.NetworkInterfacesData,
  wslInfo: { isWsl: boolean; networkingMode?: string }
): Promise<string | undefined> {
  const name = iface.iface.toLowerCase();
  const ip = iface.ip4 || '';

  // Docker network interfaces
  if (name.startsWith('docker') || name === 'docker0') {
    return 'bridge';
  }

  if (name.startsWith('br-')) {
    // Docker custom bridge network
    return 'bridge';
  }

  if (name.startsWith('veth')) {
    // Virtual ethernet - typically Docker container endpoint
    return 'veth';
  }

  // Check for Docker overlay network (usually in swarm mode)
  if (name.includes('overlay') || name.startsWith('ingress')) {
    return 'overlay';
  }

  // macvlan interfaces typically have 'macvlan' or 'macv' in name
  if (name.includes('macvlan') || name.includes('macv')) {
    return 'macvlan';
  }

  // ipvlan interfaces
  if (name.includes('ipvlan') || name.includes('ipv')) {
    return 'ipvlan';
  }

  // WSL-specific detection
  if (wslInfo.isWsl) {
    // eth0 in WSL is the main interface
    if (name === 'eth0') {
      // Check if it's mirrored mode by looking at IP patterns
      // Mirrored mode: interface mirrors Windows host networking
      // NAT mode: uses virtual NAT (typically 172.x.x.x range for WSL)
      if (ip.startsWith('172.') || ip.startsWith('192.168.')) {
        // Could be NAT (WSL2 default uses 172.x.x.x or similar)
        // But 192.168.x.x could also be mirrored if that's the Windows network
        // Best heuristic: WSL2 NAT typically uses 172.16-31.x.x range
        if (ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
          return 'NAT';
        }
        // For mirrored mode with shared host networking
        return 'mirrored';
      }
      // 10.x.x.x range could be either, default to NAT for WSL
      if (ip.startsWith('10.')) {
        return 'NAT';
      }
      return 'NAT'; // Default assumption for WSL eth0
    }
  }

  // VPN/Tunnel interfaces
  if (name.startsWith('tun') || name.startsWith('tap')) {
    return 'tunnel';
  }

  if (name.includes('wireguard') || name.startsWith('wg')) {
    return 'wireguard';
  }

  // Virtual bridge interfaces (libvirt, etc.)
  if (name.startsWith('virbr')) {
    return 'bridge';
  }

  // For physical interfaces, don't set a mode
  return undefined;
}

/**
 * Collect network metrics
 */
export async function collectNetwork(): Promise<NetworkMetrics> {
  const [netStats, netInterfaces, wslInfo] = await Promise.all([
    si.networkStats(),
    si.networkInterfaces(),
    detectWslNetworkInfo(),
  ]);

  // Calculate total bandwidth from all interfaces (in bytes/sec)
  let totalDownload = 0;
  let totalUpload = 0;

  for (const stat of netStats) {
    totalDownload += stat.rx_sec || 0;
    totalUpload += stat.tx_sec || 0;
  }

  // Keep as bytes/sec for frontend formatting
  const downloadBps = totalDownload;
  const uploadBps = totalUpload;

  // Filter interfaces first
  const filteredInterfaces = (Array.isArray(netInterfaces) ? netInterfaces : [netInterfaces])
    .filter((iface): iface is si.Systeminformation.NetworkInterfacesData =>
      iface !== null && typeof iface === 'object' && 'iface' in iface
    )
    .filter(iface => !iface.virtual && iface.iface !== 'lo');

  // Map interfaces with connection mode detection
  const interfaces: NetworkInterface[] = await Promise.all(
    filteredInterfaces.map(async iface => ({
      name: iface.iface,
      ip: iface.ip4 || '-',
      mac: iface.mac,
      status: iface.operstate === 'up' ? 'up' : 'down',
      type: iface.type || 'unknown',
      connectionMode: await getConnectionMode(iface, wslInfo),
    }))
  );

  return {
    download: downloadBps,
    upload: uploadBps,
    interfaces,
  };
}
