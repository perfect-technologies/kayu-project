'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  CheckCircle,
  XCircle,
  Calendar,
  MessageCircle,
  Star,
  CreditCard,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { notificationsApi, queryKeys } from '@kayu/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type NotificationType =
  | 'BOOKING_NEW'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_STARTED'
  | 'NEW_MESSAGE'
  | 'NEW_REVIEW'
  | 'NEW_CLIENT_REVIEW'
  | 'PAYMENT_RECEIVED'
  | 'CERTIFICATION_VERIFIED'
  | 'BADGE_EARNED'
  | 'SYSTEM';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationListProps {
  /** Optional initial notifications from SSR; will be superseded by React Query data */
  initialNotifications?: Notification[];
  onViewAll?: () => void;
  className?: string;
  compact?: boolean;
}

const notificationIcons: Record<NotificationType, typeof Bell> = {
  BOOKING_NEW: Calendar,
  BOOKING_CONFIRMED: CheckCircle,
  BOOKING_CANCELLED: XCircle,
  BOOKING_COMPLETED: CheckCircle,
  BOOKING_STARTED: Calendar,
  NEW_MESSAGE: MessageCircle,
  NEW_REVIEW: Star,
  NEW_CLIENT_REVIEW: Star,
  PAYMENT_RECEIVED: CreditCard,
  CERTIFICATION_VERIFIED: CheckCircle,
  BADGE_EARNED: Star,
  SYSTEM: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  BOOKING_NEW: 'text-blue-500 bg-blue-100',
  BOOKING_CONFIRMED: 'text-green-500 bg-green-100',
  BOOKING_CANCELLED: 'text-red-500 bg-red-100',
  BOOKING_COMPLETED: 'text-green-500 bg-green-100',
  BOOKING_STARTED: 'text-blue-500 bg-blue-100',
  NEW_MESSAGE: 'text-purple-500 bg-purple-100',
  NEW_REVIEW: 'text-yellow-500 bg-yellow-100',
  NEW_CLIENT_REVIEW: 'text-yellow-500 bg-yellow-100',
  PAYMENT_RECEIVED: 'text-emerald-500 bg-emerald-100',
  CERTIFICATION_VERIFIED: 'text-green-500 bg-green-100',
  BADGE_EARNED: 'text-amber-500 bg-amber-100',
  SYSTEM: 'text-gray-500 bg-gray-100',
};

export function NotificationList({
  initialNotifications,
  onViewAll,
  className,
  compact = false,
}: NotificationListProps) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.notifications.all({ limit: compact ? 5 : 20 }),
    queryFn: () => notificationsApi(apiClient).getAll({ limit: compact ? 5 : 20 }),
    placeholderData: initialNotifications
      ? { notifications: initialNotifications, unreadCount: initialNotifications.filter(n => !n.isRead).length, pagination: { total: initialNotifications.length, page: 1, limit: 20, totalPages: 1 } }
      : undefined,
  });

  const notifications: Notification[] = (data?.notifications as Notification[] | undefined) ?? [];

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi(apiClient).markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi(apiClient).markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className={cn(compact && 'p-4 pb-2')}>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(compact && 'p-4 pt-0')}>
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune notification</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={cn('flex flex-row items-center justify-between', compact && 'p-4 pb-2')}>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Tout marquer lu
          </Button>
        )}
      </CardHeader>
      <CardContent className={cn(compact && 'p-4 pt-0')}>
        <ScrollArea className={cn('pr-4', compact ? 'max-h-64' : 'max-h-96')}>
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              const colorClass = notificationColors[notification.type];

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'flex gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                    notification.isRead
                      ? 'bg-muted/50 hover:bg-muted'
                      : 'bg-primary/5 hover:bg-primary/10'
                  )}
                  onClick={() => {
                    if (!notification.isRead) {
                      markRead.mutate(notification.id);
                    }
                  }}
                >
                  <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        !notification.isRead && 'text-foreground'
                      )}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {onViewAll && notifications.length >= 5 && (
          <Button variant="ghost" size="sm" className="w-full mt-3" onClick={onViewAll}>
            Voir toutes les notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
