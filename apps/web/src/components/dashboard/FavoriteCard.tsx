'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  MapPin,
  Heart,
  MessageCircle,
  Calendar,
  CheckCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteProvider {
  id: string;
  name: string;
  avatar?: string | null;
  profession: string;
  city?: string | null;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  isCertified: boolean;
}

interface FavoriteCardProps {
  provider: FavoriteProvider;
  onRemove?: () => void;
  onBook?: () => void;
  onMessage?: () => void;
  onViewProfile?: () => void;
}

export function FavoriteCard({
  provider,
  onRemove,
  onBook,
  onMessage,
  onViewProfile,
}: FavoriteCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={provider.avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {provider.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{provider.name}</h3>
                  {provider.isCertified && (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{provider.profession}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={onRemove}
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <span className="font-medium text-foreground">{provider.rating.toFixed(1)}</span>
                <span>({provider.totalReviews} avis)</span>
              </div>
              {provider.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{provider.city}</span>
                </div>
              )}
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  provider.isAvailable
                    ? 'border-green-200 text-green-700'
                    : 'border-gray-200 text-gray-500'
                )}
              >
                {provider.isAvailable ? 'Disponible' : 'Indisponible'}
              </Badge>
            </div>

            <div className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1" onClick={onBook}>
                <Calendar className="h-4 w-4 mr-1" />
                Réserver
              </Button>
              <Button variant="outline" size="sm" onClick={onMessage}>
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onViewProfile}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FavoriteListProps {
  providers: FavoriteProvider[];
  onRemove?: (providerId: string) => void;
  onBook?: (providerId: string) => void;
  onMessage?: (providerId: string) => void;
  onViewProfile?: (providerId: string) => void;
  className?: string;
}

export function FavoriteList({
  providers,
  onRemove,
  onBook,
  onMessage,
  onViewProfile,
  className,
}: FavoriteListProps) {
  if (providers.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <Heart className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Aucun favori</p>
        <p className="text-sm mt-1">Ajoutez des prestataires à vos favoris pour les retrouver facilement</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {providers.map((provider) => (
        <FavoriteCard
          key={provider.id}
          provider={provider}
          onRemove={() => onRemove?.(provider.id)}
          onBook={() => onBook?.(provider.id)}
          onMessage={() => onMessage?.(provider.id)}
          onViewProfile={() => onViewProfile?.(provider.id)}
        />
      ))}
    </div>
  );
}
