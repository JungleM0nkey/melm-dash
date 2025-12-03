import { Box } from '@chakra-ui/react';
import melmLogo from '../../assets/melmlogo.png';

interface DistroIconProps {
  distro?: string;
  size?: number;
  color?: string; // Optional hex color to apply to the icon
}

/**
 * Pre-computed CSS filters for our preset colors
 * These were generated using https://codepen.io/sosuke/pen/Pjoqqp
 * which finds optimal filter values through iteration
 */
const COLOR_FILTERS: Record<string, string> = {
  // Default gray
  '': 'brightness(0) saturate(100%) invert(70%) sepia(0%) saturate(0%)',
  // Purple #805AD5
  '#805AD5': 'brightness(0) saturate(100%) invert(37%) sepia(52%) saturate(1239%) hue-rotate(232deg) brightness(93%) contrast(91%)',
  // Blue #4299E1
  '#4299E1': 'brightness(0) saturate(100%) invert(56%) sepia(52%) saturate(2177%) hue-rotate(190deg) brightness(99%) contrast(84%)',
  // Teal #38B2AC
  '#38B2AC': 'brightness(0) saturate(100%) invert(62%) sepia(47%) saturate(498%) hue-rotate(127deg) brightness(94%) contrast(87%)',
  // Green #48BB78
  '#48BB78': 'brightness(0) saturate(100%) invert(66%) sepia(44%) saturate(459%) hue-rotate(93deg) brightness(92%) contrast(88%)',
  // Yellow #ECC94B
  '#ECC94B': 'brightness(0) saturate(100%) invert(79%) sepia(45%) saturate(648%) hue-rotate(359deg) brightness(99%) contrast(89%)',
  // Orange #ED8936
  '#ED8936': 'brightness(0) saturate(100%) invert(58%) sepia(67%) saturate(617%) hue-rotate(346deg) brightness(99%) contrast(91%)',
  // Red #F56565
  '#F56565': 'brightness(0) saturate(100%) invert(52%) sepia(47%) saturate(1637%) hue-rotate(322deg) brightness(101%) contrast(93%)',
  // Pink #ED64A6
  '#ED64A6': 'brightness(0) saturate(100%) invert(52%) sepia(63%) saturate(1049%) hue-rotate(299deg) brightness(97%) contrast(92%)',
  // White #FFFFFF
  '#FFFFFF': 'brightness(0) saturate(100%) invert(100%)',
};

/**
 * Get CSS filter for a given hex color
 */
function hexToFilter(hex: string): string {
  const normalizedHex = hex?.toUpperCase() || '';
  return COLOR_FILTERS[normalizedHex] || COLOR_FILTERS[''];
}

/**
 * Display Linux distribution icon or MELM logo based on distro ID
 * Falls back to generic Linux icon if distro is unknown
 */
export function DistroIcon({ distro, size = 12, color }: DistroIconProps) {
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

  // Special handling for MELM logo (PNG) - wider aspect ratio (2:1)
  if (normalizedDistro === 'melm') {
    return (
      <Box
        as="img"
        src={melmLogo}
        alt="MELM Logo"
        width={`${size * 2}px`}
        height={`${size}px`}
        display="inline-block"
        verticalAlign="middle"
        borderRadius="md"
        objectFit="contain"
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
        filter: hexToFilter(color || ''),
      }}
    />
  );
}
