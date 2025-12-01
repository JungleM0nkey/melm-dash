import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import { useNetwork } from '../../context/DashboardContext';
import { NetworkChart } from '../charts/NetworkChart';

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function NetworkPanel() {
  const { network, history } = useNetwork();

  return (
    <VStack spacing={4} align="stretch" h="100%">
      {/* Current Speed */}
      <SimpleGrid columns={2} spacing={4}>
        <Stat size="sm">
          <StatLabel fontSize="xs" color="fg.muted">
            <Text as="span" color="chart.download">↓</Text> Download
          </StatLabel>
          <StatNumber fontSize="lg" color="chart.download">
            {network ? formatSpeed(network.download) : '--'}
          </StatNumber>
        </Stat>
        <Stat size="sm">
          <StatLabel fontSize="xs" color="fg.muted">
            <Text as="span" color="chart.upload">↑</Text> Upload
          </StatLabel>
          <StatNumber fontSize="lg" color="chart.upload">
            {network ? formatSpeed(network.upload) : '--'}
          </StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Network Chart */}
      <Box flex="1" minH="80px">
        <NetworkChart data={history} height={80} />
      </Box>

      {/* Interfaces */}
      {network && network.interfaces.length > 0 && (
        <Box>
          <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={2}>
            Interfaces
          </Text>
          <VStack spacing={2} align="stretch">
            {network.interfaces.slice(0, 3).map((iface, index) => (
              <HStack
                key={`${iface.name}-${index}`}
                justify="space-between"
                p={2}
                bg="bg.header"
                borderRadius="md"
              >
                <Box>
                  <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      {iface.name}
                    </Text>
                    <Badge
                      colorScheme={iface.status === 'up' ? 'green' : 'red'}
                      fontSize="xs"
                    >
                      {iface.status}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="fg.muted">
                    {iface.type}
                  </Text>
                </Box>
                <Box textAlign="right">
                  <Text fontSize="xs" fontFamily="mono">
                    {iface.ip}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" fontFamily="mono">
                    {iface.mac}
                  </Text>
                </Box>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
