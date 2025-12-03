import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Box, Text, useToken } from '@chakra-ui/react';
import type { TimeSeriesPoint } from '@melm-dash/shared-types';
import { useInterpolatedData } from '../../hooks/useInterpolatedData';
import { formatSpeed } from '../../utils/formatters';

interface NetworkChartProps {
  data: TimeSeriesPoint<{ download: number; upload: number }>[];
  height?: number;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null;

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.primary"
      borderRadius="md"
      p={2}
      shadow="lg"
    >
      <Text fontSize="xs" color="fg.muted" mb={1}>
        {label ? formatTime(label) : ''}
      </Text>
      {payload.map((entry) => (
        <Text key={entry.dataKey} fontSize="sm" color={entry.dataKey === 'download' ? 'chart.download' : 'chart.upload'}>
          {entry.dataKey === 'download' ? '↓' : '↑'} {formatSpeed(entry.value)}
        </Text>
      ))}
    </Box>
  );
}

export function NetworkChart({ data, height = 100 }: NetworkChartProps) {
  // Get theme-aware colors
  const [downloadColor, uploadColor, axisColor] = useToken('colors', [
    'chart.downloadLine',
    'chart.uploadLine',
    'chart.axis',
  ]);

  const rawChartData = useMemo(
    () =>
      data.map((point) => ({
        download: point.data.download,
        upload: point.data.upload,
        timestamp: point.timestamp,
      })),
    [data]
  );

  // Apply smooth interpolation between data updates
  // The hook handles first render internally (skips animation when no previous data)
  const chartData = useInterpolatedData(rawChartData);

  // Calculate max value for Y axis
  const maxValue = Math.max(
    ...chartData.flatMap((d) => [d.download, d.upload]),
    1024 // minimum 1 KB/s
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="gradient-download" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={downloadColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={downloadColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradient-upload" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={uploadColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={uploadColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          tick={{ fontSize: 10, fill: axisColor }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatSpeed}
          tick={{ fontSize: 10, fill: axisColor }}
          axisLine={false}
          tickLine={false}
          domain={[0, maxValue]}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="download"
          stroke={downloadColor}
          strokeWidth={2}
          fill="url(#gradient-download)"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="upload"
          stroke={uploadColor}
          strokeWidth={2}
          fill="url(#gradient-upload)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
