'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, MessageCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  reply?: string | null;
  repliedAt?: Date | null;
  client: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  booking: {
    title: string;
  };
}

interface ReviewCardProps {
  review: Review;
  isProvider?: boolean;
  onReply?: (reviewId: string) => void;
  compact?: boolean;
}

export function ReviewCard({
  review,
  isProvider,
  onReply,
  compact = false,
}: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-200'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
            <AvatarImage src={review.client.avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {review.client.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-medium text-sm">{review.client.name}</span>
              {renderStars(review.rating)}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-1">
              Pour: <span className="text-foreground">{review.booking.title}</span>
            </p>

            {review.comment && (
              <p className="text-sm text-foreground mt-2">{review.comment}</p>
            )}

            {review.reply && (
              <div className="mt-3 pl-3 border-l-2 border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Votre réponse</p>
                <p className="text-sm">{review.reply}</p>
                {review.repliedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(review.repliedAt), 'd MMM yyyy', { locale: fr })}
                  </p>
                )}
              </div>
            )}

            {isProvider && !review.reply && onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs"
                onClick={() => onReply(review.id)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Répondre
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReviewListProps {
  reviews: Review[];
  isProvider?: boolean;
  onReply?: (reviewId: string) => void;
  compact?: boolean;
  className?: string;
}

export function ReviewList({
  reviews,
  isProvider,
  onReply,
  compact,
  className,
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className={cn('text-center py-6 text-muted-foreground', className)}>
        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucun avis pour le moment</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          isProvider={isProvider}
          onReply={onReply}
          compact={compact}
        />
      ))}
    </div>
  );
}
