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
import melmLogo from '../../assets/melmlogo.png';
import { useLogoPreference } from '../../hooks/useLogoPreference';
import { SettingsModal } from '../modals/SettingsModal';
import { DistroIcon } from '../panels/DistroIcon';

interface DashboardHeaderProps {
  onResetLayout: () => void;
}

export function DashboardHeader({ onResetLayout }: DashboardHeaderProps) {
  const connectionStatus = useConnectionStatus();
  const systemInfo = useSystemInfo();
  const [logoPreference, setLogoPreference] = useLogoPreference();
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
          {/* Logo - melm logo is larger for better visibility */}
          <Box
            w={logoPreference === 'melm' ? 12 : 10}
            h={logoPreference === 'melm' ? 12 : 10}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {logoPreference === 'melm' ? (
              <Image
                src={melmLogo}
                alt="MELM Dashboard Logo"
                w={12}
                h={12}
                objectFit="contain"
                borderRadius="lg"
              />
            ) : (
              <DistroIcon distro={logoPreference} size={40} />
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
        onSave={setLogoPreference}
      />
    </Box>
  );
}
