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
  useToken,
} from '@chakra-ui/react';
import { useCpu, useMemory } from '../../context/DashboardContext';
import { AreaSparkline } from '../charts/AreaSparkline';

export function SystemResourcesPanel() {
  const { cpu, history: cpuHistory } = useCpu();
  const { memory, history: memoryHistory } = useMemory();

  // Get theme-aware chart colors
  const [cpuColor, ramColor] = useToken('colors', ['chart.cpuLine', 'chart.ramLine']);

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
          <AreaSparkline data={cpuHistory} color={cpuColor} height={50} />
        </Box>
        {cpu && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            {cpu.model} • {cpu.physicalCores > 0 ? `${cpu.physicalCores} cores / ` : ''}{cpu.cores} threads{cpu.speed > 0 ? ` @ ${cpu.speed.toFixed(2)} GHz` : ''}
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
          <AreaSparkline data={memoryHistory} color={ramColor} height={50} />
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
