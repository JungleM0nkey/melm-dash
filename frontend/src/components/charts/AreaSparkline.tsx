import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from 'recharts';
import type { TimeSeriesPoint } from '@melm-dash/shared-types';

interface AreaSparklineProps {
  data: TimeSeriesPoint<number>[];
  color: string;
  height?: number;
  maxValue?: number;
}

export function AreaSparkline({
  data,
  color,
  height = 60,
  maxValue = 100,
}: AreaSparklineProps) {
  const chartData = data.map((point) => ({
    value: point.data,
    timestamp: point.timestamp,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={[0, maxValue]} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color.replace('#', '')})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
