'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  MessageCircle,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface BookingCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: BookingStatus;
  scheduledDate?: Date | null;
  address?: string | null;
  city?: string | null;
  price?: number | null;
  duration?: number | null;
  otherParty: {
    id: string;
    name: string;
    avatar?: string | null;
    role: 'CLIENT' | 'PROVIDER';
    profession?: string;
  };
  isProvider?: boolean;
  onViewDetails?: () => void;
  onMessage?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
}

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
  CONFIRMED: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  IN_PROGRESS: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  COMPLETED: { label: 'Terminé', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

export function BookingCard({
  title,
  description,
  status,
  scheduledDate,
  address,
  city,
  price,
  duration,
  otherParty,
  isProvider,
  onViewDetails,
  onMessage,
  onConfirm,
  onCancel,
  onComplete,
}: BookingCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' CDF';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar and Info */}
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarImage src={otherParty.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {otherParty.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground truncate">{title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isProvider ? 'Client: ' : 'Prestataire: '}
                    <span className="font-medium text-foreground">{otherParty.name}</span>
                    {otherParty.profession && (
                      <span className="text-muted-foreground"> • {otherParty.profession}</span>
                    )}
                  </p>
                </div>

                <Badge variant="outline" className={cn('shrink-0', statusInfo.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>

              {description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{description}</p>
              )}

              {/* Details row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                {scheduledDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(scheduledDate), 'd MMM yyyy', { locale: fr })}</span>
                  </div>
                )}
                {duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{duration} min</span>
                  </div>
                )}
                {(address || city) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">{address || city}</span>
                  </div>
                )}
                {price && (
                  <div className="flex items-center gap-1 font-medium text-foreground">
                    <span>{formatPrice(price)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-between sm:justify-center shrink-0">
            <div className="flex gap-2">
              {onViewDetails && (
                <Button variant="outline" size="sm" onClick={onViewDetails}>
                  Détails
                </Button>
              )}
              {onMessage && (
                <Button variant="ghost" size="sm" onClick={onMessage}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Quick actions based on status */}
            {status === 'PENDING' && !isProvider && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Annuler
              </Button>
            )}
            {status === 'PENDING' && isProvider && (
              <div className="flex gap-2">
                <Button size="sm" onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
                  Confirmer
                </Button>
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Refuser
                </Button>
              </div>
            )}
            {status === 'CONFIRMED' && isProvider && (
              <Button size="sm" onClick={onComplete}>
                Marquer terminé
              </Button>
            )}
            {status === 'COMPLETED' && !isProvider && (
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                <Star className="h-4 w-4 mr-1" />
                Noter
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMessage}>
                  Envoyer un message
                </DropdownMenuItem>
                {status !== 'COMPLETED' && status !== 'CANCELLED' && (
                  <DropdownMenuItem onClick={onCancel} className="text-red-600">
                    {isProvider ? 'Refuser' : 'Annuler'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
