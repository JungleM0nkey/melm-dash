import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
} from '@chakra-ui/react';
import { useCpu, useMemory } from '../../context/DashboardContext';
import { AreaSparkline } from '../charts/AreaSparkline';

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export function SystemResourcesPanel() {
  const { cpu, history: cpuHistory } = useCpu();
  const { memory, history: memoryHistory } = useMemory();

  return (
    <VStack spacing={4} align="stretch" h="100%">
      {/* CPU Section */}
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" fontWeight="medium" color="fg.muted">
            CPU Usage
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="chart.cpu">
            {cpu?.usage.toFixed(1) ?? '--'}%
          </Text>
        </HStack>
        <Progress
          value={cpu?.usage ?? 0}
          size="sm"
          borderRadius="full"
          sx={{
            '& > div': {
              bg: 'chart.cpu',
            },
            bg: 'bg.header',
          }}
        />
        <Box mt={2}>
          <AreaSparkline data={cpuHistory} color="#805AD5" height={50} />
        </Box>
        {cpu && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            {cpu.model} • {cpu.cores} cores{cpu.speed > 0 ? ` @ ${cpu.speed.toFixed(2)} GHz` : ''}
          </Text>
        )}
      </Box>

      {/* Memory Section */}
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" fontWeight="medium" color="fg.muted">
            Memory Usage
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="chart.ram">
            {memory?.usage.toFixed(1) ?? '--'}%
          </Text>
        </HStack>
        <Progress
          value={memory?.usage ?? 0}
          size="sm"
          borderRadius="full"
          sx={{
            '& > div': {
              bg: 'chart.ram',
            },
            bg: 'bg.header',
          }}
        />
        <Box mt={2}>
          <AreaSparkline data={memoryHistory} color="#38B2AC" height={50} />
        </Box>
        {memory && (
          <SimpleGrid columns={3} spacing={2} mt={2}>
            <Stat size="sm">
              <StatLabel fontSize="xs" color="fg.muted">Used</StatLabel>
              <StatNumber fontSize="sm">{memory.used.toFixed(1)} GB</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="xs" color="fg.muted">Available</StatLabel>
              <StatNumber fontSize="sm">{memory.available.toFixed(1)} GB</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="xs" color="fg.muted">Total</StatLabel>
              <StatNumber fontSize="sm">{memory.total.toFixed(1)} GB</StatNumber>
            </Stat>
          </SimpleGrid>
        )}
      </Box>
    </VStack>
  );
}
