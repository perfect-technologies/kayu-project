"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertCircle, MessageCircle, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { notificationsApi } from "@kayu/api";

interface Notification {
  id: string;
  type: 'booking' | 'message' | 'review' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  data?: Record<string, unknown>;
}

interface NotificationListProps {
  // Optional: pass notifications directly (e.g. for SSR pre-load or demo)
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

const notificationIcons = {
  booking: Calendar,
  message: MessageCircle,
  review: Star,
  payment: CheckCircle,
  system: AlertCircle,
};

const notificationColors = {
  booking: 'bg-blue-100 text-blue-600',
  message: 'bg-green-100 text-green-600',
  review: 'bg-yellow-100 text-yellow-600',
  payment: 'bg-purple-100 text-purple-600',
  system: 'bg-gray-100 text-gray-600',
};

export function NotificationList({
  notifications: propNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationListProps) {
  const queryClient = useQueryClient();

  // Fetch notifications via React Query + @kayu/api (only if not passed as props)
  const { data: fetchedData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi(apiClient).getAll(),
    enabled: !propNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi(apiClient).markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi(apiClient).markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Use prop notifications or fetched ones
  const rawNotifications = propNotifications ?? (fetchedData?.notifications as Notification[] | undefined) ?? [];

  // Normalise timestamps (API may return strings)
  const notifications: Notification[] = rawNotifications.map((n) => ({
    ...n,
    timestamp: n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp as unknown as string),
  }));

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    } else {
      markReadMutation.mutate(id);
    }
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    } else {
      markAllReadMutation.mutate();
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const today = new Date();
    const notifDate = new Date(notification.timestamp);

    let group = 'Plus anciennes';
    if (notifDate.toDateString() === today.toDateString()) {
      group = "Aujourd'hui";
    } else if (notifDate.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString()) {
      group = 'Hier';
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <Card className="kayou-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-1">
              Aucune notification
            </h3>
            <p className="text-muted-foreground text-sm">
              Nous vous informerons dès qu&apos;il y aura du nouveau
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([group, notifs]) => (
              <div key={group}>
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">
                  {group}
                </h4>
                <div className="space-y-2">
                  {notifs.map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    const colorClass = notificationColors[notification.type];

                    return (
                      <div
                        key={notification.id}
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                        className={cn(
                          "flex gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          notification.isRead
                            ? "bg-transparent hover:bg-muted/50"
                            : "bg-primary/5 hover:bg-primary/10"
                        )}
                      >
                        <div className={cn("p-2 rounded-full h-fit", colorClass)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm font-medium",
                              !notification.isRead && "text-foreground"
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Sample notifications for demo
export const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'booking',
    title: 'Nouvelle réservation',
    message: 'Jean-Pierre a réservé votre service de plomberie pour demain à 10h.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
  },
  {
    id: '2',
    type: 'review',
    title: 'Nouvel avis',
    message: 'Marie K. vous a donné 5 étoiles pour votre service de nettoyage.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isRead: false,
  },
  {
    id: '3',
    type: 'payment',
    title: 'Paiement en espèces confirmé',
    message: 'Le paiement en espèces de votre dernière prestation a été confirmé.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isRead: true,
  },
  {
    id: '4',
    type: 'message',
    title: 'Nouveau message',
    message: 'Grace N. vous a envoyé un message concernant sa réservation.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de l\'application est disponible avec des améliorations.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    isRead: true,
  },
];

export default NotificationList;
