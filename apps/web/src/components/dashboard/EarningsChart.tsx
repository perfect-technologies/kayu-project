'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartData {
  name: string;
  value?: number;
  views?: number;
  bookings?: number;
}

interface EarningsChartProps {
  data: ChartData[];
  title?: string;
  type?: 'line' | 'area' | 'bar';
  dataKey?: string;
  color?: string;
  showLegend?: boolean;
  className?: string;
  compact?: boolean;
  total?: number;
  trend?: number;
}

const chartConfig = {
  value: {
    label: 'Valeur',
    color: 'hsl(var(--primary))',
  },
  views: {
    label: 'Vues',
    color: 'hsl(220, 70%, 50%)',
  },
  bookings: {
    label: 'Réservations',
    color: 'hsl(160, 70%, 45%)',
  },
} satisfies ChartConfig;

export function EarningsChart({
  data,
  title = 'Évolution',
  type = 'area',
  dataKey = 'value',
  color,
  className,
  compact = false,
  total,
  trend,
}: EarningsChartProps) {
  const primaryColor = color || 'hsl(var(--primary))';

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <Card className={className}>
      <CardHeader className={cn(compact && 'p-4 pb-2')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          {total !== undefined && (
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-bold">
                {formatValue(total)} CDF
              </p>
              {trend !== undefined && (
                <p
                  className={cn(
                    'text-xs font-medium flex items-center justify-end gap-1',
                    trend >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend)}%
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(compact && 'p-4 pt-2')}>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={formatValue}
                width={45}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={primaryColor}
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          ) : type === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={formatValue}
                width={45}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={primaryColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={formatValue}
                width={45}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={dataKey} fill={primaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Views chart for providers
interface ViewsChartProps {
  data: { name: string; views: number }[];
  className?: string;
}

export function ViewsChart({ data, className }: ViewsChartProps) {
  return (
    <EarningsChart
      data={data}
      title="Vues du profil"
      dataKey="views"
      type="area"
      className={className}
      compact
    />
  );
}
