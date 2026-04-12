'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Check,
  Zap,
  TrendingUp,
  Eye,
  Star,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumFeature {
  label: string;
  icon: typeof Check;
}

interface PremiumUpsellProps {
  isPremium?: boolean;
  expiryDate?: Date | null;
  features?: PremiumFeature[];
  onUpgrade?: () => void;
  className?: string;
}

const defaultFeatures: PremiumFeature[] = [
  { label: 'Visibilité prioritaire dans les recherches', icon: TrendingUp },
  { label: 'Badge Prestataire Premium', icon: Crown },
  { label: 'Statistiques avancées', icon: Eye },
  { label: 'Support prioritaire', icon: Star },
];

export function PremiumUpsell({
  isPremium,
  expiryDate,
  features = defaultFeatures,
  onUpgrade,
  className,
}: PremiumUpsellProps) {
  if (isPremium) {
    return (
      <Card className={cn('bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200', className)}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-amber-200">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-900">Compte Premium</h3>
                <Badge className="bg-amber-500 text-white">Actif</Badge>
              </div>
              {expiryDate && (
                <p className="text-sm text-amber-700">
                  Expire le {new Date(expiryDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Passez en Premium
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Boostez votre visibilité et obtenez plus de clients avec notre abonnement Premium.
        </p>

        <ul className="space-y-2 mb-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="p-1 rounded-full bg-amber-100">
                  <Check className="h-3 w-3 text-amber-600" />
                </div>
                <span className="text-foreground">{feature.label}</span>
              </li>
            );
          })}
        </ul>

        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          onClick={onUpgrade}
        >
          <Zap className="h-4 w-4 mr-2" />
          Devenir Premium
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-2">
          À partir de 10.000 CDF/mois
        </p>
      </CardContent>
    </Card>
  );
}
