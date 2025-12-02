import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { Info, Clock, Calendar, Container, type LucideIcon } from 'lucide-react';
import { useSystemInfo } from '../../context/DashboardContext';
import { DistroIcon } from './DistroIcon';

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
}

interface InfoRowProps {
  label: string;
  value: string | number | undefined | React.ReactNode;
  icon?: LucideIcon | React.ReactNode;
}

// Check if value is a React component (including forwardRef components)
function isReactComponent(value: unknown): value is LucideIcon {
  if (typeof value === 'function') return true;
  // forwardRef components are objects with $$typeof and render properties
  if (typeof value === 'object' && value !== null && '$$typeof' in value && 'render' in value) {
    return true;
  }
  return false;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  // Check if icon is a component (function or forwardRef) vs already-rendered ReactNode
  const isComponent = icon && isReactComponent(icon);
  const IconComponent = isComponent ? (icon as LucideIcon) : null;
  const iconNode = !isComponent && icon ? icon : null;

  return (
    <HStack justify="space-between" py={1}>
      <HStack spacing={2}>
        {IconComponent && (
          <Box color="fg.muted">
            <IconComponent size={12} />
          </Box>
        )}
        {iconNode && (
          <Box color="fg.muted">
            {iconNode}
          </Box>
        )}
        <Text fontSize="sm" color="fg.muted">
          {label}
        </Text>
      </HStack>
      <Text fontSize="sm" fontWeight="medium" textAlign="right">
        {value ?? '-'}
      </Text>
    </HStack>
  );
}

export function SystemInfoPanel() {
  const system = useSystemInfo();

  if (!system) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="fg.muted">Loading system info...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      {/* Basic Info */}
      <Box>
        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={2}>
          System
        </Text>
        <InfoRow label="Hostname" value={system.hostname} icon={Info} />
        <InfoRow
          label="OS"
          value={system.os}
          icon={<DistroIcon distro={system.distro} />}
        />
        {system.inContainer && (
          <InfoRow
            label="Container"
            value={
              <Badge colorScheme="purple" fontSize="xs">
                {system.containerType || 'Container'}
              </Badge>
            }
            icon={Container}
          />
        )}
        <InfoRow label="Kernel" value={system.kernel} />
        <InfoRow label="Packages" value={system.packages} />
      </Box>

      <Divider borderColor="border.primary" />

      {/* Time Info */}
      <Box>
        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={2}>
          Time & Location
        </Text>
        <InfoRow label="Uptime" value={formatUptime(system.uptime)} icon={Clock} />
        <InfoRow label="Location" value={system.location} />
        <InfoRow label="Timezone" value={system.timezone} icon={Calendar} />
        <InfoRow label="Local Time" value={system.currentTime} />
      </Box>
    </VStack>
  );
}
