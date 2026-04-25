"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Briefcase } from "lucide-react";

interface ProviderAboutProps {
  provider: {
    description?: string | null;
    experience?: number | null;
    profession: string;
    trades?: Array<{
      id: string;
      name: string;
      isPrimary?: boolean;
    }>;
  };
}

export function ProviderAbout({ provider }: ProviderAboutProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">À propos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-3">
          {provider.experience && (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {provider.experience} ans d&apos;expérience
            </Badge>
          )}
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
            {provider.profession}
          </Badge>
          {provider.trades?.slice(0, 3).map((trade) => (
            <Badge key={trade.id} variant="secondary" className="py-1.5 px-3">
              {trade.name}
              {trade.isPrimary ? " · principal" : ""}
            </Badge>
          ))}
        </div>

        <Separator />

        {/* Description */}
        {provider.description ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {provider.description}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground italic">
            Aucune description disponible
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton version
export function ProviderAboutSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="h-7 w-32 bg-muted rounded animate-pulse" />
          <div className="h-7 w-28 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-px bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
