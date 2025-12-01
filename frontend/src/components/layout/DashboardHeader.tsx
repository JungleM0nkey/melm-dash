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
} from '@chakra-ui/react';
import { RotateCcw, Settings } from 'lucide-react';
import { useConnectionStatus, useSystemInfo } from '../../context/DashboardContext';
import melmLogo from '../../assets/melmlogo.png';

interface DashboardHeaderProps {
  onResetLayout: () => void;
}

export function DashboardHeader({ onResetLayout }: DashboardHeaderProps) {
  const connectionStatus = useConnectionStatus();
  const systemInfo = useSystemInfo();

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
          {/* Logo */}
          <Image
            src={melmLogo}
            alt="Melm Dashboard Logo"
            w={10}
            h={10}
            objectFit="contain"
            borderRadius="lg"
          />

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
              >
                <Settings size={16} />
              </IconButton>
            </Tooltip>
          </HStack>
        </HStack>
      </Flex>
    </Box>
  );
}
