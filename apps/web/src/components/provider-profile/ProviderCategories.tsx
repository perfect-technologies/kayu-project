"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, MapPin } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
}

interface ServiceZone {
  id: string;
  city: string;
  commune?: string | null;
}

interface ProviderCategoriesProps {
  categories: Category[];
  serviceZones: ServiceZone[];
}

export function ProviderCategories({
  categories,
  serviceZones,
}: ProviderCategoriesProps) {
  // Group service zones by city
  const groupedZones = serviceZones.reduce((acc, zone) => {
    if (!acc[zone.city]) {
      acc[zone.city] = [];
    }
    if (zone.commune) {
      acc[zone.city].push(zone.commune);
    }
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-4">
      {/* Categories */}
      {categories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Catégories de services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/services?category=${category.slug}`}
                >
                  <Badge
                    variant="secondary"
                    className="py-1.5 px-3 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                    style={category.color ? { borderColor: category.color } : undefined}
                  >
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Zones */}
      {serviceZones.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Zones d&apos;intervention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(groupedZones).map(([city, communes]) => (
                <div key={city}>
                  <p className="font-medium text-sm mb-1">{city}</p>
                  {communes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {communes.map((commune, index) => (
                        <Badge
                          key={`${commune}-${index}`}
                          variant="outline"
                          className="text-xs"
                        >
                          {commune}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {communes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Toute la ville
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Skeleton version
export function ProviderCategoriesSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-5 w-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
