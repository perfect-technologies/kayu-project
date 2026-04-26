"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { ProviderSection } from "./ProviderSection";

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
  const groupedZones = serviceZones.reduce(
    (acc, zone) => {
      if (!acc[zone.city]) {
        acc[zone.city] = [];
      }
      if (zone.commune) {
        acc[zone.city].push(zone.commune);
      }
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {categories.length > 0 && (
        <ProviderSection title="Catégories de services">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/services?category=${category.slug}`}
                className="k-chip k-chip-sm"
                style={{
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </ProviderSection>
      )}

      {serviceZones.length > 0 && (
        <ProviderSection title="Zones d'intervention">
          <div style={{ display: "grid", gap: 14 }}>
            {Object.entries(groupedZones).map(([city, communes]) => (
              <div key={city}>
                <div
                  className="k-overline"
                  style={{ marginBottom: 8, color: "var(--k-text-muted)" }}
                >
                  {city}
                </div>
                {communes.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {communes.map((commune, index) => (
                      <span
                        key={`${commune}-${index}`}
                        className="k-chip k-chip-sm k-chip-primary"
                      >
                        <MapPin className="h-3 w-3" />
                        {commune}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className="k-caption"
                    style={{ color: "var(--k-text-muted)" }}
                  >
                    Toute la ville
                  </p>
                )}
              </div>
            ))}
          </div>
        </ProviderSection>
      )}
    </div>
  );
}

export function ProviderCategoriesSkeleton() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        className="animate-k-shimmer"
        style={{ height: 130, borderRadius: "var(--k-r-lg)" }}
      />
      <div
        className="animate-k-shimmer"
        style={{ height: 160, borderRadius: "var(--k-r-lg)" }}
      />
    </div>
  );
}
