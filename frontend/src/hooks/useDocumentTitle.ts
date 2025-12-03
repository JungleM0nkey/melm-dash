import { useEffect } from 'react';
import { useConnectionStatus, useSystemInfo } from '../context/DashboardContext';

// Generate a simple circle favicon as a data URI
function generateFaviconDataUri(color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color}"/>
    </svg>
  `.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const statusColors: Record<string, string> = {
  connected: '#48BB78', // green.400
  disconnected: '#F56565', // red.400
  reconnecting: '#ECC94B', // yellow.400
};

export function useDocumentTitle() {
  const connectionStatus = useConnectionStatus();
  const systemInfo = useSystemInfo();

  useEffect(() => {
    const hostname = systemInfo?.hostname || 'Melm';
    document.title = `${hostname} - Dashboard`;
  }, [systemInfo?.hostname]);

  useEffect(() => {
    const color = statusColors[connectionStatus] || statusColors.disconnected;
    const faviconUri = generateFaviconDataUri(color);

    // Find or create favicon link element
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.type = 'image/svg+xml';
    link.href = faviconUri;
  }, [connectionStatus]);
}
