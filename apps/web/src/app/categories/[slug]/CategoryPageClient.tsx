"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Users,
  Briefcase,
  ChevronRight,
  Home,
  type LucideIcon,
} from "lucide-react";
import { ProviderCard } from "@/components/providers";
import { cn } from "@/lib/utils";

// Icon mapping with vibrant colors
const iconMap: Record<string, { icon: LucideIcon; color: string; gradient: string }> = {
  Sparkles: { icon: Briefcase, color: "#10B981", gradient: "from-emerald-500 to-teal-600" },
  Droplets: { icon: Briefcase, color: "#3B82F6", gradient: "from-blue-500 to-blue-700" },
  Zap: { icon: Briefcase, color: "#F59E0B", gradient: "from-amber-500 to-orange-600" },
  Scissors: { icon: Briefcase, color: "#EC4899", gradient: "from-pink-500 to-rose-600" },
  GraduationCap: { icon: Briefcase, color: "#06B6D4", gradient: "from-cyan-500 to-teal-600" },
  HardHat: { icon: Briefcase, color: "#F97316", gradient: "from-orange-500 to-red-600" },
  TreeDeciduous: { icon: Briefcase, color: "#22C55E", gradient: "from-green-500 to-emerald-600" },
  Car: { icon: Briefcase, color: "#8B5CF6", gradient: "from-violet-500 to-purple-600" },
  Truck: { icon: Briefcase, color: "#6366F1", gradient: "from-indigo-500 to-blue-600" },
  Laptop: { icon: Briefcase, color: "#0EA5E9", gradient: "from-sky-500 to-cyan-600" },
  Heart: { icon: Briefcase, color: "#EF4444", gradient: "from-red-500 to-rose-600" },
  Palette: { icon: Briefcase, color: "#D946EF", gradient: "from-fuchsia-500 to-pink-600" },
  ChefHat: { icon: Briefcase, color: "#84CC16", gradient: "from-lime-500 to-green-600" },
  Shirt: { icon: Briefcase, color: "#F472B6", gradient: "from-pink-400 to-rose-500" },
  Snowflake: { icon: Briefcase, color: "#38BDF8", gradient: "from-sky-400 to-blue-500" },
  Key: { icon: Briefcase, color: "#FBBF24", gradient: "from-amber-400 to-yellow-500" },
  Baby: { icon: Briefcase, color: "#F9A8D4", gradient: "from-pink-300 to-rose-400" },
  PartyPopper: { icon: Briefcase, color: "#A855F7", gradient: "from-purple-500 to-violet-600" },
  Wheat: { icon: Briefcase, color: "#A3E635", gradient: "from-lime-400 to-green-500" },
  Music: { icon: Briefcase, color: "#C084FC", gradient: "from-purple-400 to-fuchsia-500" },
  Wrench: { icon: Briefcase, color: "#78716C", gradient: "from-stone-500 to-neutral-600" },
};

// Types
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

// Get icon component
const getCategoryIcon = (iconName: string | null): { icon: LucideIcon; color: string; gradient: string } => {
  if (iconName && iconMap[iconName]) return iconMap[iconName];
  return { icon: Briefcase, color: "#64748B", gradient: "from-slate-500 to-gray-600" };
};

// Breadcrumb component
function Breadcrumb({ category }: { category: { name: string; slug: string } }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Accueil</span>
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0" />
      <Link
        href="/services"
        className="hover:text-foreground transition-colors"
      >
        Services
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0" />
      <span className="text-foreground font-medium truncate">{category.name}</span>
    </nav>
  );
}

// Category Header
function CategoryHeader({ category }: { category: Category }) {
  const { icon: IconComponent } = getCategoryIcon(category.icon ?? null);

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 md:p-8 lg:p-12 mb-8">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
        {/* Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center bg-white/20 backdrop-blur-sm shrink-0">
          <IconComponent className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 text-white">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-white/80 text-sm md:text-base lg:text-lg mb-4 max-w-2xl">
              {category.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <Badge className="bg-white/20 text-white border-0 gap-1.5 px-3 py-1.5">
              <Users className="h-4 w-4" />
              {category.providerCount} prestataire{category.providerCount > 1 ? "s" : ""}
            </Badge>
            {category.subcategories.length > 0 && (
              <Badge className="bg-white/20 text-white border-0 gap-1.5 px-3 py-1.5">
                <Briefcase className="h-4 w-4" />
                {category.subcategories.length} sous-catégorie{category.subcategories.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* View all button */}
        <Link href={`/services?category=${category.slug}`} className="shrink-0">
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-white/90 h-12 px-6 rounded-xl shadow-xl"
          >
            Voir tous les prestataires
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Subcategories Grid
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Sous-catégories
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Explorez les spécialités dans {categoryName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {subcategories.map((subcategory) => {
          const { icon: IconComponent, gradient } = getCategoryIcon(subcategory.icon ?? null);
          return (
            <Link
              key={subcategory.id}
              href={`/services?category=${categorySlug}&subcategory=${subcategory.slug}`}
              className="group"
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white rounded-xl overflow-hidden">
                <CardContent className="p-4 md:p-5 text-center">
                  <div className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110 bg-gradient-to-br",
                    gradient
                  )}>
                    <IconComponent className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-2 mb-1">
                    {subcategory.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {subcategory.providerCount}+ prest.
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// Featured Providers Section
function FeaturedProviders({
  providers,
  categoryName,
  categorySlug,
}: {
  providers: Category["featuredProviders"];
  categoryName: string;
  categorySlug: string;
}) {
  if (providers.length === 0) {
    return (
      <section className="mb-10">
        <Card className="border-0 shadow-lg rounded-xl">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun prestataire disponible
            </h3>
            <p className="text-gray-500 mb-4">
              Il n&apos;y a pas encore de prestataires dans cette catégorie.
            </p>
            <Link href="/services">
              <Button variant="outline">
                Voir tous les services
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Badge className="mb-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            Top prestataires
          </Badge>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Meilleurs prestataires en {categoryName}
          </h2>
        </div>
        <Link href={`/services?category=${categorySlug}`}>
          <Button variant="outline" className="gap-2 rounded-xl">
            Voir tous
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </section>
  );
}

// Main Client Component
export function CategoryPageClient({ category }: CategoryPageClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubcategoryClick = (subcategorySlug: string) => {
    setIsLoading(true);
    router.push(`/services?category=${category.slug}&subcategory=${subcategorySlug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <Breadcrumb category={category} />

        {/* Category Header */}
        <CategoryHeader category={category} />

        {/* Subcategories Grid */}
        <SubcategoriesGrid
          subcategories={category.subcategories}
          categorySlug={category.slug}
          categoryName={category.name}
        />

        {/* Featured Providers */}
        <FeaturedProviders
          providers={category.featuredProviders}
          categoryName={category.name}
          categorySlug={category.slug}
        />

        {/* View All Providers CTA */}
        {category.providerCount > 6 && (
          <div className="text-center py-8">
            <Card className="inline-block border-0 shadow-lg rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6 md:p-8">
                <p className="text-gray-600 mb-4">
                  Découvrez les <strong>{category.providerCount}</strong> prestataires en {category.name}
                </p>
                <Link href={`/services?category=${category.slug}`}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg"
                  >
                    Voir tous les prestataires en {category.name}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
