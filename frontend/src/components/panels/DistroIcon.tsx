import { Box } from '@chakra-ui/react';
import melmLogo from '../../assets/melmlogo.png';

interface DistroIconProps {
  distro?: string;
  size?: number;
}

/**
 * Display Linux distribution icon or MELM logo based on distro ID
 * Falls back to generic Linux icon if distro is unknown
 */
export function DistroIcon({ distro, size = 12 }: DistroIconProps) {
  // Map of supported distributions (SVG icons)
  const supportedDistros = [
    'ubuntu',
    'debian',
    'arch',
    'fedora',
    'alpine',
    'nixos',
    'opensuse',
    'centos',
  ];

  const normalizedDistro = distro?.toLowerCase();

  // Special handling for MELM logo (PNG)
  if (normalizedDistro === 'melm') {
    return (
      <Box
        as="img"
        src={melmLogo}
        alt="MELM Logo"
        width={`${size}px`}
        height={`${size}px`}
        display="inline-block"
        verticalAlign="middle"
        borderRadius="md"
      />
    );
  }

  // Determine which SVG icon to use
  const iconName = normalizedDistro && supportedDistros.includes(normalizedDistro)
    ? normalizedDistro
    : 'linux';

  // Reference SVG from public directory (works in dev and production)
  const iconPath = `/distro-icons/${iconName}.svg`;

  return (
    <Box
      as="img"
      src={iconPath}
      alt={`${distro || 'Linux'} icon`}
      width={`${size}px`}
      height={`${size}px`}
      display="inline-block"
      verticalAlign="middle"
      style={{
        filter: 'brightness(0) saturate(100%) invert(67%) sepia(0%) saturate(0%) hue-rotate(0deg)',
      }}
    />
  );
}
