import React from 'react';
import { Badge } from '@/components/common/Badge';
import type { ViewStyle } from 'react-native';

const STATUS_CONFIG: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'error' | 'neutral' }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmée', variant: 'primary' },
  IN_PROGRESS: { label: 'Confirmée', variant: 'primary' },
  COMPLETED: { label: 'Terminée', variant: 'success' },
  CANCELLED: { label: 'Annulée', variant: 'error' },
  REJECTED: { label: 'Refusée', variant: 'error' },
};

interface BookingStatusBadgeProps {
  status: string;
  style?: ViewStyle;
}

export function BookingStatusBadge({ status, style }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'neutral' as const };
  return <Badge label={config.label} variant={config.variant} style={style} />;
}
