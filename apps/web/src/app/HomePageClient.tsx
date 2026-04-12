"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Clock,
  Star as StarIcon,
  MapPin,
  Wrench,
  ArrowRight,
  Menu,
  X,
  User,
  Loader2,
  Sparkles,
  Zap,
  Shield,
  Briefcase,
  LogIn,
  UserPlus,
  Home,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RegisterDialog } from "@/components/auth/RegisterDialog";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Layout } from "@/components/layout";
import type { PublicStatsResponse } from "@kayu/schemas";

// Popular services data
const popularServices = [
  {
    id: "1",
    name: "Nettoyage complet",
    description: "Ménage complet de votre domicile",
    price: 25000,
    duration: "2-3h",
    rating: 4.8,
    reviews: 234,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    category: "Ménage",
    categorySlug: "menage-nettoyage",
    gradient: "from-emerald-500/20 to-teal-500/20",
    glowColor: "emerald" as const,
  },
  {
    id: "2",
    name: "Réparation plomberie",
    description: "Intervention rapide pour fuites",
    price: 35000,
    duration: "1-2h",
    rating: 4.9,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
    category: "Plomberie",
    categorySlug: "plomberie",
    gradient: "from-blue-500/20 to-cyan-500/20",
    glowColor: "blue" as const,
  },
  {
    id: "3",
    name: "Dépannage électrique",
    description: "Installation et réparation",
    price: 30000,
    duration: "1-2h",
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
    category: "Électricité",
    categorySlug: "electricite",
    gradient: "from-amber-500/20 to-orange-500/20",
    glowColor: "blue" as const,
  },
  {
    id: "4",
    name: "Coiffure à domicile",
    description: "Service coiffure chez vous",
    price: 15000,
    duration: "1h",
    rating: 4.9,
    reviews: 312,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    category: "Beauté",
    categorySlug: "coiffure-beaute",
    gradient: "from-pink-500/20 to-rose-500/20",
    glowColor: "purple" as const,
  },
];

// Testimonials
const testimonials = [
  {
    name: "Marie K.",
    role: "Cliente à Kinshasa",
    content: "J'ai trouvé un excellent plombier en moins de 10 minutes. Service rapide et professionnel !",
    rating: 5,
    avatar: "MK",
    service: "Plomberie",
  },
  {
    name: "Jean-Pierre M.",
    role: "Prestataire Électricien",
    content: "Grâce à KAYOU, j'ai pu développer ma clientèle et vivre de mon métier.",
    rating: 5,
    avatar: "JP",
    service: "Électricité",
  },
  {
    name: "Grace N.",
    role: "Cliente à Brazzaville",
    content: "Le système de notation m'a permis de choisir un prestataire fiable.",
    rating: 5,
    avatar: "GN",
    service: "Transport",
  },
];

// Categories
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string | null;
  color: string | null;
  providersCount: number;
}

// Props for the client component
interface HomePageClientProps {
  initialStats: PublicStatsResponse | null;
  initialCategories: Category[];
}

// ============ COMPONENTS ============

// Animated mesh background
function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d12] to-[#0a0a0f]" />

      {/* Animated mesh gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[128px] animate-float" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] animate-float-slow" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[128px] animate-float" />
      <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[128px] animate-float-slow" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
}

// Hero Section with glassmorphism
function HeroSection({
  onClientRegister,
  onProviderRegister,
  onLogin,
}: {
  onClientRegister: () => void;
  onProviderRegister: () => void;
  onLogin: () => void;
}) {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Floating badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl rounded-full px-5 py-2.5 mb-8 animate-fade-in border border-white/10 shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="text-white/80 font-medium text-sm">
              Disponible à Kinshasa & Brazzaville
            </span>
          </div>

          {/* Main headline with gradient */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
            Trouvez le prestataire
            <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                qu&apos;il vous faut
              </span>
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full opacity-60" />
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto animate-fade-in-up delay-200 px-4">
            KAYOU connecte les particuliers et entreprises aux meilleurs prestataires
            de services en RDC et Congo-Brazzaville.
          </p>

          {/* CTA Buttons - Prominent */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10 animate-fade-in-up delay-300">
            <GlassButton
              variant="primary"
              size="lg"
              onClick={onClientRegister}
              className="h-14 px-8 text-lg"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              S&apos;inscrire gratuitement
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="lg"
              onClick={onLogin}
              className="h-14 px-8 text-lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Se connecter
            </GlassButton>
          </div>

          {/* Secondary CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-10 animate-fade-in-up delay-400">
            <button
              onClick={onProviderRegister}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              <Wrench className="h-4 w-4" />
              Devenir prestataire
            </button>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              <Search className="h-4 w-4" />
              Explorer les services
            </Link>
          </div>

          {/* Search Bar */}
          <div className="animate-fade-in-up delay-500 px-4 md:px-0">
            <GlassCard variant="elevated" className="p-4 md:p-6 max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    type="text"
                    placeholder="Quel service recherchez-vous ?"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="relative md:w-48">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <select className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white appearance-none cursor-pointer focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20">
                    <option value="Kinshasa">Kinshasa</option>
                    <option value="Brazzaville">Brazzaville</option>
                    <option value="Lubumbashi">Lubumbashi</option>
                  </select>
                </div>
                <GlassButton variant="primary" size="lg" className="h-12 md:h-auto px-8">
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher
                </GlassButton>
              </div>

              {/* Popular searches */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
                <span className="text-white/40 text-sm">Populaire:</span>
                {["Plombier", "Électricien", "Ménage", "Coiffeur"].map((term) => (
                  <Link key={term} href={`/services?q=${term.toLowerCase()}`}>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                      {term}
                    </span>
                  </Link>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-2.5 bg-white/30 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}

// Stats Section with glass cards
function StatsSection({ stats }: { stats: PublicStatsResponse | null }) {
  const platformStats = [
    {
      label: "Prestataires",
      value: stats ? `${stats.totalProviders.toLocaleString()}+` : "10K+",
      change: "+12%",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Clients satisfaits",
      value: stats ? `${stats.totalClients.toLocaleString()}+` : "50K+",
      change: "+25%",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      label: "Services",
      value: stats ? `${stats.totalCategories}+` : "100+",
      change: "24/7",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      label: "Villes",
      value: stats ? `${stats.providersByCity.length}+` : "5+",
      change: "RDC & Congo",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <section className="py-16 md:py-20 relative">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {platformStats.map((stat, index) => (
            <GlassCard
              key={stat.label}
              variant="elevated"
              className="p-6 text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient accent line */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r",
                stat.gradient
              )} />

              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/60">{stat.label}</div>
              <div className="text-xs font-semibold mt-2 text-white/40">{stat.change}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// Popular Services Section
function PopularServicesSection() {
  return (
    <section className="py-16 md:py-20 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <Badge className="mb-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Tendances
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Services populaires
            </h2>
            <p className="text-white/50 text-base md:text-lg">
              Les services les plus demandés par nos clients
            </p>
          </div>
          <Link href="/services">
            <GlassButton variant="secondary" className="hidden md:flex">
              Voir tout
              <ArrowRight className="h-4 w-4 ml-2" />
            </GlassButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularServices.map((service, index) => (
            <Link key={service.id} href={`/services?category=${service.categorySlug}`}>
              <GlassCard
                variant="glow"
                glowColor={service.glowColor}
                className="group cursor-pointer overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image with gradient overlay */}
                <div className="relative h-48 overflow-hidden rounded-t-2xl">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={cn("absolute inset-0 bg-gradient-to-t opacity-60", service.gradient)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Category badge */}
                  <Badge className="absolute top-3 left-3 bg-white/10 backdrop-blur-md border-white/20 text-white">
                    {service.category}
                  </Badge>

                  {/* Rating */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-1">
                      <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-white">{service.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-white mb-1.5">{service.name}</h3>
                  <p className="text-sm text-white/50 mb-4 line-clamp-2">{service.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <span className="text-xs text-white/40">À partir de</span>
                      <p className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {service.price.toLocaleString()} CDF
                      </p>
                    </div>
                    <GlassButton variant="secondary" size="sm">
                      Réserver
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="text-center mt-10 md:hidden">
          <Link href="/services">
            <GlassButton variant="primary">
              Voir tous les services
              <ArrowRight className="h-4 w-4 ml-2" />
            </GlassButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Categories Section
function CategoriesSection({
  categories,
  onCategoryClick,
}: {
  categories: Category[];
  onCategoryClick: (slug: string) => void;
}) {
  return (
    <section id="services" className="py-16 md:py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30">
            <Zap className="h-3 w-3 mr-1" />
            Explorer
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
            Catégories de services
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-base md:text-lg">
            Plus de 100 catégories pour répondre à tous vos besoins
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {categories.slice(0, 12).map((category, index) => (
              <GlassCard
                key={category.id}
                variant="default"
                className="group cursor-pointer p-4 text-center hover:scale-105 transition-transform duration-300"
                onClick={() => onCategoryClick(category.slug)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 group-hover:border-blue-500/30 transition-colors">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-medium text-sm text-white line-clamp-2">{category.name}</h3>
                <p className="text-xs text-white/40 mt-1">{category.providersCount}+</p>
              </GlassCard>
            ))}
          </div>
        )}

        {categories.length > 12 && (
          <div className="text-center mt-10">
            <Link href="/services">
              <GlassButton variant="secondary">
                Voir toutes les catégories
                <ArrowRight className="h-4 w-4 ml-2" />
              </GlassButton>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    { step: 1, title: "Recherchez", description: "Entrez le service et votre localisation", icon: Search },
    { step: 2, title: "Choisissez", description: "Comparez les profils et les avis", icon: Shield },
    { step: 3, title: "Réservez", description: "Planifiez et payez en toute sécurité", icon: Clock },
    { step: 4, title: "Évaluez", description: "Donnez votre avis sur le service", icon: StarIcon },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30">
            Simple
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Comment ça marche ?
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {steps.map((item, index) => (
            <GlassCard
              key={item.step}
              variant="elevated"
              className="p-6 text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step number with gradient */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                {item.step}
              </div>
              <h3 className="font-bold text-base md:text-lg text-white mb-1">{item.title}</h3>
              <p className="text-xs md:text-sm text-white/50">{item.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30">
            Témoignages
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Ce que disent nos utilisateurs
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <GlassCard variant="elevated" className="p-8 md:p-10 text-center">
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                <StarIcon key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Quote */}
            <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed italic">
              &quot;{testimonials[activeIndex].content}&quot;
            </p>

            {/* Author */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white text-lg">
                {testimonials[activeIndex].avatar}
              </div>
              <div className="text-center sm:text-left">
                <p className="font-bold text-white">{testimonials[activeIndex].name}</p>
                <p className="text-sm text-white/50">{testimonials[activeIndex].role}</p>
              </div>
              <Badge className="bg-white/10 border-white/20 text-white/70">
                {testimonials[activeIndex].service}
              </Badge>
            </div>
          </GlassCard>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "w-8 bg-gradient-to-r from-blue-500 to-purple-500"
                    : "w-2 bg-white/20 hover:bg-white/30"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection({ onClientRegister, onProviderRegister }: {
  onClientRegister: () => void;
  onProviderRegister: () => void;
}) {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />

      <div className="container mx-auto px-4 relative z-10">
        <GlassCard variant="elevated" className="max-w-3xl mx-auto p-8 md:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Rejoignez KAYOU dès maintenant
          </h2>
          <p className="text-white/60 mb-8 text-base md:text-lg">
            Que vous soyez client ou prestataire, KAYOU est fait pour vous
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlassButton variant="primary" size="lg" onClick={onClientRegister}>
              <User className="mr-2 h-5 w-5" />
              Je cherche un service
            </GlassButton>
            <GlassButton variant="secondary" size="lg" onClick={onProviderRegister}>
              <Wrench className="mr-2 h-5 w-5" />
              Je suis prestataire
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

// App Download Section
function AppDownloadSection() {
  return (
    <section className="py-16 md:py-20 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 max-w-5xl mx-auto">
          <div className="flex-1 text-center md:text-left">
            <Badge className="mb-3 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30">
              Bientôt disponible
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Téléchargez l&apos;application KAYOU
            </h2>
            <p className="text-white/50 mb-8 text-base md:text-lg">
              Profitez de tous nos services directement depuis votre mobile.
              Disponible prochainement sur Android et iOS.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/services">
                <GlassButton variant="secondary" className="w-full sm:w-auto">
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 2H6.477C4.106 2 2 4.106 2 6.477v11.046C2 19.894 4.106 22 6.477 22h11.046C19.894 22 22 19.894 22 17.523V6.477C22 4.106 19.894 2 17.523 2z"/>
                  </svg>
                  App Store
                </GlassButton>
              </Link>
              <Link href="/services">
                <GlassButton variant="secondary" className="w-full sm:w-auto">
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  Google Play
                </GlassButton>
              </Link>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex-shrink-0 hidden sm:block">
            <div className="relative w-56 md:w-64 h-[420px] md:h-[480px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-2 shadow-2xl shadow-black/50">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl" />
              <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-[2rem] flex items-center justify-center overflow-hidden">
                <div className="text-center px-4">
                  <Image
                    src="/kayou-logo-transparent.png"
                    alt="KAYOU"
                    width={100}
                    height={36}
                    className="mx-auto"
                  />
                  <p className="text-white/80 text-xs mt-2">Votre service à portée de main</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Floating Shortcuts Bar - Beautiful Icon Navigation
function FloatingShortcuts() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Shortcut items with beautiful icons
  const shortcuts = [
    {
      id: 'home',
      icon: Home,
      label: 'Accueil',
      href: '/',
      color: 'from-blue-500 to-cyan-500',
      shadowColor: 'shadow-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      id: 'services',
      icon: Briefcase,
      label: 'Services',
      href: '#services',
      color: 'from-purple-500 to-pink-500',
      shadowColor: 'shadow-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      id: 'search',
      icon: Search,
      label: 'Rechercher',
      href: '#',
      onClick: () => (document.querySelector('input[type="text"]') as HTMLInputElement)?.focus(),
      color: 'from-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: 'Aide',
      href: '#how-it-works',
      color: 'from-amber-500 to-orange-500',
      shadowColor: 'shadow-amber-500/30',
      iconColor: 'text-amber-400',
    },
    {
      id: 'contact',
      icon: Sparkles,
      label: 'Contact',
      href: '#',
      color: 'from-pink-500 to-rose-500',
      shadowColor: 'shadow-pink-500/30',
      iconColor: 'text-pink-400',
    },
  ];

  return (
    <>
      {/* Desktop Floating Shortcuts - Right Side */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-50 flex-col items-end gap-3">
        {/* Expanded Shortcuts Menu */}
        <div className={cn(
          "flex flex-col gap-2 transition-all duration-500 ease-out",
          isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          {shortcuts.map((shortcut, index) => {
            const IconComponent = shortcut.icon;
            return (
              <Link
                key={shortcut.id}
                href={shortcut.href}
                onClick={shortcut.onClick}
                className="group flex items-center gap-3"
                style={{ transitionDelay: isExpanded ? `${index * 50}ms` : '0ms' }}
              >
                {/* Label */}
                <span className="px-3 py-2 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 text-sm font-medium text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {shortcut.label}
                </span>
                {/* Icon Button */}
                <button className={cn(
                  "relative w-12 h-12 rounded-xl bg-gradient-to-br backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-300",
                  "hover:scale-110 hover:border-white/40",
                  shortcut.shadowColor,
                  "shadow-lg"
                )}>
                  <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-20", shortcut.color)} />
                  <IconComponent className={cn("h-5 w-5 relative z-10", shortcut.iconColor)} />
                </button>
              </Link>
            );
          })}
        </div>

        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-white/40 shadow-lg",
            showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          <svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>

        {/* Main Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center transition-all duration-300 shadow-xl",
            "hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/40",
            isExpanded && "rotate-45"
          )}
        >
          {isExpanded ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Menu className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Floating Shortcuts - Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
        <div className="bg-[#0a0a0f]/90 backdrop-blur-2xl border-t border-white/10">
          {/* Shortcuts Row */}
          <div className="flex items-center justify-around px-2 py-2">
            {shortcuts.slice(0, 4).map((shortcut) => {
              const IconComponent = shortcut.icon;
              return (
                <Link
                  key={shortcut.id}
                  href={shortcut.href}
                  onClick={shortcut.onClick}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/5"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    shortcut.color,
                    "opacity-80"
                  )}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-[10px] text-white/60 font-medium">{shortcut.label}</span>
                </Link>
              );
            })}
            {/* More Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/5"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center transition-transform",
                isExpanded && "rotate-45"
              )}>
                {isExpanded ? (
                  <X className="h-5 w-5 text-white" />
                ) : (
                  <Menu className="h-5 w-5 text-white" />
                )}
              </div>
              <span className="text-[10px] text-white/60 font-medium">Plus</span>
            </button>
          </div>
        </div>

        {/* Expanded Mobile Menu */}
        <div className={cn(
          "absolute bottom-full left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-2xl border-t border-white/10 transition-all duration-300 overflow-hidden",
          isExpanded ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="p-4 grid grid-cols-3 gap-3">
            {/* Contact/Support Option */}
            <Link
              href="#"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              onClick={() => setIsExpanded(false)}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-white/80 font-medium">Contact</span>
            </Link>
            {/* FAQ Option */}
            <Link
              href="#"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              onClick={() => setIsExpanded(false)}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-white/80 font-medium">FAQ</span>
            </Link>
            {/* Scroll to Top */}
            <button
              onClick={() => { scrollToTop(); setIsExpanded(false); }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <span className="text-xs text-white/80 font-medium">Haut</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============ MAIN CLIENT COMPONENT ============
export default function HomePageClient({ initialStats, initialCategories }: HomePageClientProps) {
  const router = useRouter();
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerRole, setRegisterRole] = useState<'CLIENT' | 'PROVIDER'>('CLIENT');

  const handleCategoryClick = (slug: string) => {
    router.push(`/categories/${slug}`);
  };

  const handleClientRegister = () => {
    setRegisterRole('CLIENT');
    setRegisterDialogOpen(true);
  };

  const handleProviderRegister = () => {
    setRegisterRole('PROVIDER');
    setRegisterDialogOpen(true);
  };

  return (
    <Layout>
      <div className="flex flex-col pb-24 md:pb-0">
        <MeshBackground />

        <HeroSection
          onClientRegister={handleClientRegister}
          onProviderRegister={handleProviderRegister}
          onLogin={() => setLoginDialogOpen(true)}
        />

        <StatsSection stats={initialStats} />

        <PopularServicesSection />

        <CategoriesSection
          categories={initialCategories}
          onCategoryClick={handleCategoryClick}
        />

        <HowItWorksSection />

        <TestimonialsSection />

        <CTASection
          onClientRegister={handleClientRegister}
          onProviderRegister={handleProviderRegister}
        />

        <AppDownloadSection />

        {/* Floating Shortcuts Bar */}
        <FloatingShortcuts />

        <RegisterDialog
          open={registerDialogOpen}
          onOpenChange={setRegisterDialogOpen}
          onSwitchToLogin={() => {
            setRegisterDialogOpen(false);
            setLoginDialogOpen(true);
          }}
        />

        <LoginDialog
          open={loginDialogOpen}
          onOpenChange={setLoginDialogOpen}
          onSwitchToRegister={() => {
            setLoginDialogOpen(false);
            setRegisterDialogOpen(true);
          }}
        />
      </div>
    </Layout>
  );
}
