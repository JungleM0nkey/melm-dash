import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
} from '@chakra-ui/react';
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, type LucideIcon } from 'lucide-react';
import { useServices } from '../../context/DashboardContext';
import { formatUptime } from '../../utils/formatters';

// Store the icon mapping without the Icon suffix to avoid React 19 confusion
const statusConfig: Record<string, { color: string; icon: LucideIcon }> = {
  running: { color: 'green', icon: CheckCircle },
  stopped: { color: 'red', icon: XCircle },
  failed: { color: 'red', icon: AlertTriangle },
  unknown: { color: 'gray', icon: HelpCircle },
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
        // Extract component and capitalize for React 19 compatibility
        const StatusIcon = config.icon;
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
                <StatusIcon size={16} />
              </Box>
              <Text fontSize="sm" fontWeight="medium">
                {service.name}
              </Text>
            </HStack>
            <HStack spacing={2}>
              {service.uptime && service.status === 'running' && (
                <Text fontSize="xs" color="fg.muted">
                  {formatUptime(service.uptime, true)}
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