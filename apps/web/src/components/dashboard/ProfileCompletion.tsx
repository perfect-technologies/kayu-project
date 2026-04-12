'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  User,
  Briefcase,
  MapPin,
  Image,
  Star,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletionItem {
  key: string;
  label: string;
  completed: boolean;
  icon: typeof User;
}

interface ProfileCompletionProps {
  percentage: number;
  items: CompletionItem[];
  onComplete?: (key: string) => void;
  className?: string;
}

export function ProfileCompletion({
  percentage,
  items,
  onComplete,
  className,
}: ProfileCompletionProps) {
  const incompleteItems = items.filter(item => !item.completed);

  return (
    <Card className={cn('bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center justify-between">
          <span>Complétude du profil</span>
          <span className="text-primary font-bold">{percentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-2 mb-4" />

        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg',
                  item.completed ? 'bg-green-50' : 'bg-background/50'
                )}
              >
                <div className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Icon className={cn(
                    'h-4 w-4',
                    item.completed ? 'text-green-600' : 'text-muted-foreground'
                  )} />
                  <span className={cn(
                    'text-sm',
                    item.completed ? 'text-green-700' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                </div>
                {!item.completed && onComplete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onComplete(item.key)}
                  >
                    Compléter
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {incompleteItems.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Complétez votre profil pour apparaître dans les recherches
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Default profile completion items for providers
export function getProviderCompletionItems(profile: {
  hasPhoto?: boolean;
  hasDescription?: boolean;
  hasSkills?: boolean;
  hasServiceZones?: boolean;
  hasPortfolio?: boolean;
}): CompletionItem[] {
  return [
    {
      key: 'photo',
      label: 'Photo de profil',
      completed: profile.hasPhoto ?? false,
      icon: Image,
    },
    {
      key: 'description',
      label: 'Description professionnelle',
      completed: profile.hasDescription ?? false,
      icon: User,
    },
    {
      key: 'skills',
      label: 'Compétences',
      completed: profile.hasSkills ?? false,
      icon: Star,
    },
    {
      key: 'zones',
      label: 'Zones de service',
      completed: profile.hasServiceZones ?? false,
      icon: MapPin,
    },
    {
      key: 'portfolio',
      label: 'Portfolio',
      completed: profile.hasPortfolio ?? false,
      icon: Briefcase,
    },
  ];
}
