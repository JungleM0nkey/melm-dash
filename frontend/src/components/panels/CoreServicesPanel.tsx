import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
} from '@chakra-ui/react';
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { useServices } from '../../context/DashboardContext';

function formatUptime(seconds?: number): string {
  if (!seconds) return '';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const statusConfig: Record<string, { color: string; Icon: React.ComponentType<{ size?: number }> }> = {
  running: { color: 'green', Icon: CheckCircle },
  stopped: { color: 'red', Icon: XCircle },
  failed: { color: 'red', Icon: AlertTriangle },
  unknown: { color: 'gray', Icon: HelpCircle },
};

export function CoreServicesPanel() {
  const services = useServices();

  if (services.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="fg.muted">No services found</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={2} align="stretch">
      {services.map((service, index) => {
        const config = statusConfig[service.status] || statusConfig.unknown;
        const IconComponent = config.Icon;
        return (
          <HStack
            key={`${service.name}-${index}`}
            justify="space-between"
            p={2}
            bg="bg.header"
            borderRadius="md"
            _hover={{ bg: 'bg.hover' }}
          >
            <HStack spacing={2}>
              <Box color={`${config.color}.400`}>
                <IconComponent size={16} />
              </Box>
              <Text fontSize="sm" fontWeight="medium">
                {service.name}
              </Text>
            </HStack>
            <HStack spacing={2}>
              {service.uptime && service.status === 'running' && (
                <Text fontSize="xs" color="fg.muted">
                  {formatUptime(service.uptime)}
                </Text>
              )}
              <Badge
                colorScheme={config.color}
                fontSize="xs"
                textTransform="capitalize"
              >
                {service.status}
              </Badge>
            </HStack>
          </HStack>
        );
      })}
    </VStack>
  );
}
