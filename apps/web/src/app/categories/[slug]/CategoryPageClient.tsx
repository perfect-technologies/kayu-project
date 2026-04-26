"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Users,
  Briefcase,
  ChevronRight,
  Home,
  type LucideIcon,
} from "lucide-react";
import { ProviderShowcaseCard } from "@kayu/ui/web";
import { toProviderCardData } from "@/lib/provider-card";

const iconMap: Record<string, LucideIcon> = {
  Sparkles: Briefcase,
  Droplets: Briefcase,
  Zap: Briefcase,
  Scissors: Briefcase,
  GraduationCap: Briefcase,
  HardHat: Briefcase,
  TreeDeciduous: Briefcase,
  Car: Briefcase,
  Truck: Briefcase,
  Laptop: Briefcase,
  Heart: Briefcase,
  Palette: Briefcase,
  ChefHat: Briefcase,
  Shirt: Briefcase,
  Snowflake: Briefcase,
  Key: Briefcase,
  Baby: Briefcase,
  PartyPopper: Briefcase,
  Wheat: Briefcase,
  Music: Briefcase,
  Wrench: Briefcase,
};

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  providerCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  providerCount: number;
  subcategories: Subcategory[];
  featuredProviders: Array<{
    id: string;
    userId: string;
    profession: string;
    description?: string | null;
    hourlyRate?: number | null;
    rating: number;
    totalReviews: number;
    totalJobs: number;
    isCertified: boolean;
    isPremium: boolean;
    isAvailable: boolean;
    experience?: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
      city?: string | null;
      isVerified: boolean;
      latitude?: number | null;
      longitude?: number | null;
    };
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      icon?: string | null;
      color?: string | null;
    }>;
    serviceZones: Array<{
      city: string;
      commune?: string | null;
    }>;
  }>;
}

interface CategoryPageClientProps {
  category: Category;
}

const getCategoryIcon = (iconName: string | null): LucideIcon =>
  iconName && iconMap[iconName] ? iconMap[iconName] : Briefcase;

function Breadcrumb({ category }: { category: { name: string } }) {
  return (
    <nav
      className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap"
      style={{ color: "var(--k-text-muted)", fontSize: 13 }}
    >
      <Link
        href="/"
        className="flex items-center gap-1 transition-colors hover:text-[var(--k-text-primary)]"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Accueil</span>
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0" />
      <Link
        href="/services"
        className="transition-colors hover:text-[var(--k-text-primary)]"
      >
        Services
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0" />
      <span
        className="truncate font-medium"
        style={{ color: "var(--k-text-primary)" }}
      >
        {category.name}
      </span>
    </nav>
  );
}

function CategoryHeader({ category }: { category: Category }) {
  const IconComponent = getCategoryIcon(category.icon ?? null);

  return (
    <section
      className="mb-8 flex flex-col gap-5 rounded-[var(--k-r-lg)] p-6 md:flex-row md:items-center md:p-8"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        boxShadow: "var(--k-e1)",
      }}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--k-r-md)] md:h-16 md:w-16"
        style={{
          background: "var(--k-primary-subtle)",
          color: "var(--k-primary-hover)",
        }}
      >
        <IconComponent className="h-7 w-7 md:h-8 md:w-8" />
      </div>

      <div className="flex-1">
        <h1 className="k-display-l" style={{ margin: "0 0 6px" }}>
          {category.name}
        </h1>
        {category.description && (
          <p
            className="k-body"
            style={{
              color: "var(--k-text-muted)",
              margin: "0 0 14px",
              maxWidth: 640,
            }}
          >
            {category.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium"
            style={{
              background: "var(--k-primary-subtle)",
              color: "var(--k-primary-hover)",
            }}
          >
            <Users className="h-4 w-4" />
            {category.providerCount} pro{category.providerCount > 1 ? "s" : ""}
          </span>
          {category.subcategories.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium"
              style={{
                background: "var(--k-surface-muted)",
                color: "var(--k-text-body)",
              }}
            >
              <Briefcase className="h-4 w-4" />
              {category.subcategories.length} spécialité
              {category.subcategories.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <Link
        href={`/services?category=${category.slug}`}
        className="k-btn k-btn-primary k-btn-lg shrink-0"
      >
        Voir tous les pros
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function SubcategoriesGrid({
  subcategories,
  categorySlug,
  categoryName,
}: {
  subcategories: Subcategory[];
  categorySlug: string;
  categoryName: string;
}) {
  if (subcategories.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-5">
        <h2 className="k-display-m" style={{ margin: 0 }}>
          Spécialités
        </h2>
        <p
          className="k-body-m mt-1"
          style={{ color: "var(--k-text-muted)" }}
        >
          Explore les spécialités dans {categoryName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {subcategories.map((subcategory) => {
          const IconComponent = getCategoryIcon(subcategory.icon ?? null);
          return (
            <Link
              key={subcategory.id}
              href={`/services?category=${categorySlug}&subcategory=${subcategory.slug}`}
              className="group flex flex-col items-center justify-center rounded-[var(--k-r-md)] p-4 text-center transition-all"
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                boxShadow: "var(--k-e1)",
              }}
            >
              <div
                className="mb-2 flex h-11 w-11 items-center justify-center rounded-[10px] transition-transform group-hover:scale-105"
                style={{
                  background: "var(--k-primary-subtle)",
                  color: "var(--k-primary-hover)",
                }}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <h3
                className="line-clamp-2 text-[14px] font-semibold"
                style={{ color: "var(--k-text-primary)" }}
              >
                {subcategory.name}
              </h3>
              <p
                className="k-caption mt-1"
                style={{ color: "var(--k-text-muted)" }}
              >
                {subcategory.providerCount}+ pros
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedProviders({
  providers,
  categoryName,
  categorySlug,
  onOpen,
}: {
  providers: Category["featuredProviders"];
  categoryName: string;
  categorySlug: string;
  onOpen: (id: string) => void;
}) {
  if (providers.length === 0) {
    return (
      <section className="mb-10">
        <div
          className="rounded-[var(--k-r-lg)] p-10 text-center"
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--k-surface-muted)" }}
          >
            <Users
              className="h-7 w-7"
              style={{ color: "var(--k-text-muted)" }}
            />
          </div>
          <h3 className="k-heading mb-2">Aucun pro disponible</h3>
          <p
            className="k-body mb-4"
            style={{ color: "var(--k-text-muted)" }}
          >
            Pas encore de pros dans cette catégorie.
          </p>
          <Link href="/services" className="k-btn k-btn-secondary">
            Voir tous les services
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div
            className="k-overline"
            style={{ color: "var(--k-accent)", marginBottom: 6 }}
          >
            Top pros
          </div>
          <h2 className="k-display-m" style={{ margin: 0 }}>
            Meilleurs pros en {categoryName}
          </h2>
        </div>
        <Link
          href={`/services?category=${categorySlug}`}
          className="k-btn k-btn-ghost"
        >
          Voir tous <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <ProviderShowcaseCard
            key={provider.id}
            provider={toProviderCardData(provider)}
            ctaLabel="Voir le profil"
            onClick={() => onOpen(provider.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function CategoryPageClient({ category }: CategoryPageClientProps) {
  const router = useRouter();

  return (
    <div style={{ background: "var(--k-bg)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-[1240px] px-5 py-6 md:px-10 md:py-8">
        <Breadcrumb category={category} />

        <CategoryHeader category={category} />

        <SubcategoriesGrid
          subcategories={category.subcategories}
          categorySlug={category.slug}
          categoryName={category.name}
        />

        <FeaturedProviders
          providers={category.featuredProviders}
          categoryName={category.name}
          categorySlug={category.slug}
          onOpen={(id) => router.push(`/providers/${id}`)}
        />

        {category.providerCount > 6 && (
          <div className="py-6 text-center">
            <div
              className="inline-flex flex-col items-center rounded-[var(--k-r-lg)] p-6 md:p-8"
              style={{
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                boxShadow: "var(--k-e1)",
              }}
            >
              <p
                className="k-body mb-4"
                style={{ color: "var(--k-text-body)" }}
              >
                Découvre les{" "}
                <b
                  className="k-num"
                  style={{ color: "var(--k-text-primary)" }}
                >
                  {category.providerCount}
                </b>{" "}
                pros en {category.name}
              </p>
              <Link
                href={`/services?category=${category.slug}`}
                className="k-btn k-btn-primary k-btn-lg"
              >
                Voir tous les pros en {category.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
