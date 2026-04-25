'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon, Plus, Search, Calendar, Settings, Eye, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickActions({
  title = 'Actions rapides',
  actions,
  columns = 2,
  className,
}: QuickActionsProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('grid gap-3', gridCols[columns])}>
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                className={cn(
                  'h-auto py-4 flex-col gap-2',
                  action.className
                )}
                onClick={action.onClick}
                asChild={!!action.href}
              >
                {action.href ? (
                  <a href={action.href}>
                    <Icon className="h-5 w-5" />
                    <span className="text-xs sm:text-sm">{action.label}</span>
                  </a>
                ) : (
                  <>
                    <Icon className="h-5 w-5" />
                    <span className="text-xs sm:text-sm">{action.label}</span>
                  </>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Predefined action sets for convenience
export function clientQuickActions(): QuickAction[] {
  return [
    { label: 'Rechercher un service', icon: Search, href: '/services' },
    { label: 'Nouvelle réservation', icon: Plus, href: '/services' },
    { label: 'Mes réservations', icon: Calendar, href: '/bookings' },
    { label: 'Paramètres', icon: Settings, href: '/dashboard/settings' },
  ];
}

export function providerQuickActions(): QuickAction[] {
  return [
    { label: 'Tableau de bord', icon: Eye, href: '/pro' },
    { label: 'Mes demandes', icon: Clock, href: '/pro/requests' },
    { label: 'Gains', icon: TrendingUp, href: '/pro/earnings' },
    { label: 'Paramètres', icon: Settings, href: '/dashboard/settings' },
  ];
}
