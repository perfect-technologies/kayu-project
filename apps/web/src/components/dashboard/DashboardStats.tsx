'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

interface DashboardStatsProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function DashboardStats({ stats, columns = 4, className }: DashboardStatsProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  {stat.trend && (
                    <p
                      className={cn(
                        'text-xs font-medium',
                        stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                      <span className="text-muted-foreground ml-1">vs mois dernier</span>
                    </p>
                  )}
                </div>
                {Icon && (
                  <div
                    className={cn(
                      'p-2 sm:p-3 rounded-lg',
                      stat.color || 'bg-primary/10'
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
