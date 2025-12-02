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
import { RotateCcw, Settings } from 'lucide-react';
import { useConnectionStatus, useSystemInfo } from '../../context/DashboardContext';
import {
  useLogoPreference,
  useLogoSize,
  useCustomLogo,
  LOGO_SIZE_VALUES,
} from '../../hooks/useLogoPreference';
import type { LogoType, LogoSize } from '../../hooks/useLogoPreference';
import { SettingsModal } from '../modals/SettingsModal';
import { DistroIcon } from '../panels/DistroIcon';

interface DashboardHeaderProps {
  onResetLayout: () => void;
}

export function DashboardHeader({ onResetLayout }: DashboardHeaderProps) {
  const connectionStatus = useConnectionStatus();
  const systemInfo = useSystemInfo();
  const [logoPreference, setLogoPreference] = useLogoPreference();
  const [logoSize, setLogoSize] = useLogoSize();
  const [customLogo, setCustomLogo] = useCustomLogo();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const statusColor = {
    connected: 'green',
    disconnected: 'red',
    reconnecting: 'yellow',
  }[connectionStatus];

  const statusText = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    reconnecting: 'Reconnecting...',
  }[connectionStatus];

  const handleSettingsSave = (logo: LogoType, size: LogoSize, customLogoData: string | null) => {
    setLogoPreference(logo);
    setLogoSize(size);
    setCustomLogo(customLogoData);
  };

  const logoSizePixels = LOGO_SIZE_VALUES[logoSize];
  // MELM logo container is wider to accommodate its aspect ratio
  const isMelm = logoPreference === 'melm';
  const containerWidth = isMelm ? `${logoSizePixels * 2 + 8}px` : `${logoSizePixels + 8}px`;
  const containerHeight = `${logoSizePixels + 8}px`;

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
              <DistroIcon distro={logoPreference} size={logoSizePixels} />
            )}
          </Box>

          {/* Title */}
          <Box>
            <Heading size="md" color="fg.primary">
              {systemInfo?.hostname || 'NixOS'} Dashboard
            </Heading>
            {systemInfo && (
              <Text fontSize="xs" color="fg.muted">
                {systemInfo.os} • {systemInfo.kernel}
              </Text>
            )}
          </Box>
        </HStack>

        <HStack spacing={4}>
          {/* Connection status */}
          <HStack spacing={2}>
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg={`${statusColor}.400`}
              boxShadow={connectionStatus === 'connected' ? `0 0 8px var(--chakra-colors-${statusColor}-400)` : undefined}
            />
            <Text fontSize="sm" color="fg.muted">
              {statusText}
            </Text>
          </HStack>

          {/* System time */}
          {systemInfo?.currentTime && (
            <Badge
              variant="subtle"
              colorScheme="gray"
              fontSize="xs"
              px={2}
              py={1}
            >
              {systemInfo.timezone}
            </Badge>
          )}

          {/* Actions */}
          <HStack spacing={1}>
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
        onSave={handleSettingsSave}
      />
    </Box>
  );
}
