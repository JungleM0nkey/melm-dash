import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  Badge,
  IconButton,
  Tooltip,
  Image,
  useDisclosure,
} from '@chakra-ui/react';
import { RotateCcw, Settings, LayoutGrid } from 'lucide-react';
import { useConnectionStatus, useSystemInfo } from '../../context/DashboardContext';
import {
  useLogoPreference,
  useLogoSize,
  useCustomLogo,
  useCustomSizeValue,
  LOGO_SIZE_VALUES,
} from '../../hooks/useLogoPreference';
import type { LogoType, LogoSize } from '../../hooks/useLogoPreference';
import { useTimezonePreference } from '../../hooks/useTimezonePreference';
import { useThemePreference, type ThemeMode } from '../../hooks/useThemePreference';
import { useLogoColor } from '../../hooks/useLogoColor';
import { useBorderRadius, type BorderRadiusStyle } from '../../hooks/useBorderRadius';
import { SettingsModal } from '../modals/SettingsModal';
import { DistroIcon } from '../panels/DistroIcon';

interface DashboardHeaderProps {
  onResetLayout: () => void;
  /** Number of hidden panels (0 = none hidden) */
  hiddenPanelCount?: number;
  /** Toggle the panel drawer */
  onTogglePanelDrawer: () => void;
  /** Whether the drawer is currently open */
  isDrawerOpen: boolean;
}

export function DashboardHeader({
  onResetLayout,
  hiddenPanelCount = 0,
  onTogglePanelDrawer,
  isDrawerOpen,
}: DashboardHeaderProps) {
  const connectionStatus = useConnectionStatus();
  const systemInfo = useSystemInfo();
  const [logoPreference, setLogoPreference] = useLogoPreference();
  const [logoSize, setLogoSize] = useLogoSize();
  const [customLogo, setCustomLogo] = useCustomLogo();
  const [customSizeValue, setCustomSizeValue] = useCustomSizeValue();
  const [timezonePreference, setTimezonePreference] = useTimezonePreference();
  const [themePreference, setThemePreference] = useThemePreference();
  const [logoColor, setLogoColor] = useLogoColor();
  const [borderRadius, setBorderRadius] = useBorderRadius();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const statusColorMap: Record<string, string> = {
    connected: 'green',
    disconnected: 'red',
    reconnecting: 'yellow',
  };
  const statusColor = statusColorMap[connectionStatus];

  const statusTextMap: Record<string, string> = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    reconnecting: 'Reconnecting...',
  };
  const statusText = statusTextMap[connectionStatus];

  const handleSettingsSave = (
    logo: LogoType,
    size: LogoSize,
    customLogoData: string | null,
    timezone: string,
    customSize: number,
    theme: ThemeMode,
    newLogoColor: string,
    newBorderRadius: BorderRadiusStyle
  ) => {
    setLogoPreference(logo);
    setLogoSize(size);
    setCustomLogo(customLogoData);
    setTimezonePreference(timezone);
    setCustomSizeValue(customSize);
    setThemePreference(theme);
    setLogoColor(newLogoColor);
    setBorderRadius(newBorderRadius);
  };

  const logoSizePixels = logoSize === 'custom' ? customSizeValue : LOGO_SIZE_VALUES[logoSize];
  // MELM logo container is wider to accommodate its aspect ratio
  const isMelm = logoPreference === 'melm';
  const containerWidth = isMelm ? `${logoSizePixels * 2 + 8}px` : `${logoSizePixels + 8}px`;
  const containerHeight = `${logoSizePixels + 8}px`;

  // Live clock state
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Determine environment type for badge
  const getEnvironmentBadge = (): { label: string; colorScheme: string } | null => {
    if (!systemInfo) return null;

    if (systemInfo.isWsl) {
      const version = systemInfo.wslVersion ? ` ${systemInfo.wslVersion}` : '';
      return { label: `WSL${version}`, colorScheme: 'blue' };
    }

    if (systemInfo.inContainer) {
      const type = systemInfo.containerType || 'Container';
      // Capitalize first letter
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      return { label, colorScheme: 'purple' };
    }

    // Native/bare-metal host
    return { label: 'Native', colorScheme: 'green' };
  };

  const environmentBadge = getEnvironmentBadge();

  // Format time based on timezone preference
  const formatLiveTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    if (timezonePreference === 'local') {
      return currentTime.toLocaleTimeString(undefined, options);
    } else if (timezonePreference === 'utc') {
      return currentTime.toLocaleTimeString(undefined, { ...options, timeZone: 'UTC' });
    } else if (systemInfo?.timezone) {
      // Use server timezone
      try {
        return currentTime.toLocaleTimeString(undefined, { ...options, timeZone: systemInfo.timezone });
      } catch {
        return currentTime.toLocaleTimeString(undefined, options);
      }
    }
    return currentTime.toLocaleTimeString(undefined, options);
  };

  return (
    <Box
      as="header"
      bg="bg.header"
      borderBottomWidth="1px"
      borderColor="border.primary"
      px={4}
      py={3}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Flex justify="space-between" align="center">
        <HStack spacing={4}>
          {/* Logo - size controlled by user preference, MELM is wider */}
          <Box
            w={containerWidth}
            h={containerHeight}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {logoPreference === 'custom' && customLogo ? (
              <Image
                src={customLogo}
                alt="Custom Logo"
                w={`${logoSizePixels}px`}
                h={`${logoSizePixels}px`}
                objectFit="contain"
                borderRadius="lg"
              />
            ) : (
              <DistroIcon distro={logoPreference} size={logoSizePixels} color={logoColor} />
            )}
          </Box>

          {/* Title with connection indicator */}
          <Box>
            <HStack spacing={2}>
              <Heading size="md" color="fg.primary">
                {systemInfo?.hostname || 'NixOS'} Dashboard
              </Heading>
              <Tooltip label={statusText} hasArrow placement="right">
                <Box
                  w={2}
                  h={2}
                  borderRadius="full"
                  bg={`${statusColor}.400`}
                  className={connectionStatus === 'connected' ? 'connection-indicator-glow' : undefined}
                  cursor="default"
                />
              </Tooltip>
            </HStack>
            {systemInfo && (
              <HStack spacing={2}>
                <Text fontSize="xs" color="fg.muted">
                  {systemInfo.os} • {systemInfo.kernel}
                </Text>
                {environmentBadge && (
                  <Badge
                    colorScheme={environmentBadge.colorScheme}
                    fontSize="2xs"
                    variant="subtle"
                    px={1.5}
                    py={0.5}
                  >
                    {environmentBadge.label}
                  </Badge>
                )}
              </HStack>
            )}
          </Box>
        </HStack>

        <HStack spacing={4}>

          {/* Live clock */}
          <Badge
            variant="subtle"
            colorScheme="gray"
            fontSize="xs"
            px={2}
            py={1}
            fontFamily="mono"
          >
            {formatLiveTime()}
          </Badge>

          {/* Hidden panels indicator */}
          {hiddenPanelCount > 0 && (
            <Badge
              colorScheme="purple"
              variant="solid"
              fontSize="xs"
              px={2}
              py={1}
            >
              {hiddenPanelCount} hidden
            </Badge>
          )}

          {/* Actions */}
          <HStack spacing={1}>
            <Tooltip label={isDrawerOpen ? 'Close Panels' : 'Manage Panels'} hasArrow>
              <IconButton
                aria-label={isDrawerOpen ? 'Close panels drawer' : 'Open panels drawer'}
                size="sm"
                variant={isDrawerOpen ? 'solid' : 'ghost'}
                colorScheme={isDrawerOpen ? 'purple' : 'gray'}
                onClick={onTogglePanelDrawer}
              >
                <LayoutGrid size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip label="Reset Layout" hasArrow>
              <IconButton
                aria-label="Reset layout"
                size="sm"
                variant="ghost"
                colorScheme="gray"
                onClick={onResetLayout}
              >
                <RotateCcw size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip label="Settings" hasArrow>
              <IconButton
                aria-label="Settings"
                size="sm"
                variant="ghost"
                colorScheme="gray"
                onClick={onOpen}
              >
                <Settings size={16} />
              </IconButton>
            </Tooltip>
          </HStack>
        </HStack>
      </Flex>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isOpen}
        onClose={onClose}
        currentLogo={logoPreference}
        currentSize={logoSize}
        currentCustomLogo={customLogo}
        currentTimezone={timezonePreference}
        currentCustomSizeValue={customSizeValue}
        currentTheme={themePreference}
        currentLogoColor={logoColor}
        currentBorderRadius={borderRadius}
        onSave={handleSettingsSave}
      />
    </Box>
  );
}
