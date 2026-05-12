"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, BadgeCheck, ArrowRight } from "lucide-react";
import {
  CategoryTile,
  TrustStrip,
  TrendingServiceCard,
  ProviderHorizontalCard,
  HowItWorksStep,
  TestimonialCard,
  ProviderDashboardPreview,
  AppPhoneMockup,
} from "@kayu/ui/web";
import type { ProviderCardData } from "@kayu/ui";
import type { PublicStatsResponse, TrendingServicesResponse } from "@kayu/schemas";
import { Layout } from "@/components/layout";
import { HARDCODED_TESTIMONIALS } from "./home/HardcodedTestimonials";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string | null;
  color: string | null;
  providersCount: number;
}

interface HomePageClientProps {
  initialStats: PublicStatsResponse | null;
  initialCategories: Category[];
  featuredProviders: ProviderCardData[];
  trending: TrendingServicesResponse;
}

// ----------------- Hero (kept) -----------------
function Hero({ onSearch }: { onSearch: (query: string, where: string) => void }) {
  const [query, setQuery] = useState("");
  const [where, setWhere] = useState("Kinshasa");
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 30%, rgba(14,165,233,0.09), transparent 50%), radial-gradient(circle at 82% 70%, rgba(251,113,133,0.06), transparent 48%)",
        }}
      />
      <div className="relative mx-auto max-w-[1240px] px-5 py-12 md:px-10 md:py-20">
        <div className="max-w-[820px]">
          <div
            className="k-overline mb-4 inline-flex items-center gap-2 rounded-full px-2 py-1 pr-3.5"
            style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }}
          >
            <span style={{ background: "var(--k-success)", color: "white", borderRadius: 9999, padding: "2px 8px", fontSize: 10 }}>NOUVEAU</span>
            Marketplace #1 de services au Congo
          </div>
          <h1 className="k-display-xl" style={{ margin: "0 0 18px" }}>
            Le bon pro,
            <br />
            <span
              style={{
                background: "linear-gradient(100deg, #0EA5E9 0%, #0EA5E9 40%, #FB7185 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              près de chez toi.
            </span>
          </h1>
          <p className="k-body-l" style={{ color: "var(--k-text-body)", maxWidth: 580, margin: "0 0 28px" }}>
            2 400 pros vérifiés à Kinshasa, Brazzaville, Lubumbashi, Matadi, Pointe-Noire. Plombiers, électriciens, coiffeurs, ménage… Réserve en quelques clics.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(query, where);
            }}
            className="k-card flex items-center p-2"
            style={{ borderRadius: "var(--k-r-lg)", boxShadow: "var(--k-e2)" }}
          >
            <label className="flex flex-1 items-center gap-3 px-5 py-3.5">
              <Search className="h-5 w-5" style={{ color: "var(--k-text-muted)" }} />
              <span className="flex-1">
                <span className="k-caption block" style={{ color: "var(--k-text-primary)", fontWeight: 600, marginBottom: 2 }}>Quel service ?</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Plomberie, coiffure, ménage…" className="w-full bg-transparent text-[15px] outline-none" style={{ color: "var(--k-text-body)" }} />
              </span>
            </label>
            <div style={{ width: 1, height: 40, background: "var(--k-border)" }} />
            <label className="flex flex-1 items-center gap-3 px-5 py-3.5">
              <MapPin className="h-5 w-5" style={{ color: "var(--k-text-muted)" }} />
              <span className="flex-1">
                <span className="k-caption block" style={{ color: "var(--k-text-primary)", fontWeight: 600, marginBottom: 2 }}>Où ?</span>
                <input value={where} onChange={(e) => setWhere(e.target.value)} className="w-full bg-transparent text-[15px] outline-none" style={{ color: "var(--k-text-body)" }} />
              </span>
            </label>
            <button type="submit" className="k-btn k-btn-primary" style={{ height: 56, padding: "0 28px", fontSize: 16 }}>
              <Search className="h-[18px] w-[18px]" />
              Rechercher
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

// ----------------- New sections -----------------

function CategoryGridSection({ categories, onSelect }: { categories: Category[]; onSelect: (slug: string) => void }) {
  const items = categories.slice(0, 12);
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-12 md:px-10">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="k-overline" style={{ color: "var(--k-text-muted)" }}>EXPLORE</div>
          <h2 className="k-display-m" style={{ margin: "4px 0 0 0" }}>Trouve ton service</h2>
        </div>
        <Link href="/services" className="k-btn k-btn-ghost">
          Voir toutes les catégories <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-6">
        {items.map((c) => (
          <CategoryTile
            key={c.id}
            label={c.name}
            iconName={c.icon ?? undefined}
            color={c.color ?? undefined}
            count={c.providersCount}
            variant="centered-mono"
            onClick={() => onSelect(c.slug)}
          />
        ))}
      </div>
    </section>
  );
}

function TrendingSection({ trending, onSelect }: { trending: TrendingServicesResponse; onSelect: (slug: string) => void }) {
  if (trending.items.length === 0) return null;
  const isTrending = trending.mode === "trending";
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-12 md:px-10">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="k-overline" style={{ color: isTrending ? "var(--k-accent)" : "var(--k-text-muted)" }}>
            {isTrending ? "🔥 TENDANCE CETTE SEMAINE" : "✨ À DÉCOUVRIR"}
          </div>
          <h2 className="k-display-m" style={{ margin: "4px 0 0 0" }}>
            {isTrending ? "Services populaires" : "Catégories à découvrir"}
          </h2>
        </div>
        <Link href="/services" className="k-btn k-btn-ghost">
          Voir tout <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
        {trending.items.map((item) => (
          <TrendingServiceCard key={item.categoryId} item={item} onClick={onSelect} />
        ))}
      </div>
    </section>
  );
}

function FeaturedProvidersSection({ providers, onOpen }: { providers: ProviderCardData[]; onOpen: (id: string) => void }) {
  const top = providers.slice(0, 4);
  if (top.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-12 md:px-10">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="k-overline" style={{ color: "var(--k-text-muted)" }}>⭐ TOP RATED</div>
          <h2 className="k-display-m" style={{ margin: "4px 0 0 0" }}>Pros vérifiés à Kinshasa</h2>
        </div>
        <Link href="/services" className="k-btn k-btn-ghost">
          Voir tous les pros <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {top.map((p) => (
          <ProviderHorizontalCard key={p.id} provider={p} onClick={onOpen} />
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { number: 1 as const, title: "Cherche un pro", desc: "Filtre par service, quartier et disponibilité. Compare les notes et les missions effectuées." },
    { number: 2 as const, title: "Discute directement", desc: "Appelle ou envoie un message pour confirmer le besoin, le prix et l'adresse." },
    { number: 3 as const, title: "Réserve et paie", desc: "Paiement en espèces à la fin de la mission. Tu notes le pro après." },
  ];
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-10" id="how-it-works">
      <div className="text-center mb-8">
        <div className="k-overline" style={{ color: "var(--k-text-muted)" }}>SIMPLE</div>
        <h2 className="k-display-m" style={{ margin: "4px 0 6px 0" }}>Comment ça marche</h2>
        <p className="k-body" style={{ color: "var(--k-text-body)" }}>Trouve, discute, réserve. En quelques clics.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <HowItWorksStep key={s.number} number={s.number} title={s.title} description={s.desc} />
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-10">
      <div className="text-center mb-8">
        <div className="k-overline" style={{ color: "var(--k-text-muted)" }}>TÉMOIGNAGES</div>
        <h2 className="k-display-m" style={{ margin: "4px 0 6px 0" }}>Ils utilisent KAYOU</h2>
        <p className="k-body" style={{ color: "var(--k-text-body)" }}>Clients et pros parlent de leur expérience.</p>
      </div>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {HARDCODED_TESTIMONIALS.map((t) => (
          <TestimonialCard key={t.name} data={t} />
        ))}
      </div>
    </section>
  );
}

function ProviderCTASection({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-10">
      <div
        className="grid items-center gap-8 overflow-hidden md:grid-cols-[1fr_1.1fr] md:p-12"
        style={{ background: "#FFFBF5", border: "1px solid #F1ECDE", borderRadius: 20, padding: 40 }}
      >
        <div>
          <div className="k-overline" style={{ color: "var(--k-accent)" }}>POUR LES PROS</div>
          <h3 className="k-display-l" style={{ margin: "8px 0 14px 0", lineHeight: 1.15 }}>Tu es un pro ?<br />Rejoins KAYOU.</h3>
          <p className="k-body" style={{ color: "var(--k-text-body)", lineHeight: 1.55, margin: "0 0 16px 0" }}>
            Crée ton profil, reçois des messages et réservations directes, construis ta réputation. Zéro frais d&apos;inscription.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Profil vérifié et notations clients",
              "Messages et appels directs",
              "Tableau de bord des revenus",
            ].map((label) => (
              <li key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--k-text-body)" }}>
                <BadgeCheck size={14} color="#15803D" strokeWidth={2.5} />
                {label}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button className="k-btn k-btn-primary k-btn-lg" onClick={onJoin}>
              Devenir pro <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/#how-it-works" className="k-btn k-btn-ghost k-btn-lg">En savoir plus</Link>
          </div>
        </div>
        <div className="hidden md:block">
          <ProviderDashboardPreview />
        </div>
      </div>
    </section>
  );
}

function AppDownloadCTASection() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-10">
      <div
        className="grid items-center gap-8 overflow-hidden md:grid-cols-[1fr_1.1fr] md:p-12"
        style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 20, padding: 40 }}
      >
        <div>
          <div className="k-overline" style={{ color: "var(--k-primary)" }}>📱 MOBILE</div>
          <h3 className="k-display-l" style={{ margin: "8px 0 14px 0", lineHeight: 1.15 }}>L&apos;app KAYOU,<br />dans ta poche.</h3>
          <p className="k-body" style={{ color: "var(--k-text-body)", lineHeight: 1.55, margin: "0 0 16px 0" }}>
            Réserve un pro, chatte, suis tes missions, reçois des alertes. iOS et Android.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Notifications en temps réel",
              "Chat avec les pros",
              "Historique et factures",
            ].map((label) => (
              <li key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--k-text-body)" }}>
                <BadgeCheck size={14} color="#15803D" strokeWidth={2.5} />
                {label}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "App Store", note: "Télécharger sur" },
              { label: "Google Play", note: "Disponible sur" },
            ].map(({ label, note }) => (
              <a
                key={label}
                href="#"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 18px",
                  textDecoration: "none",
                }}
              >
                <div style={{ textAlign: "left", lineHeight: 1.1 }}>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{note}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="hidden md:flex" style={{ position: "relative", height: 440, justifyContent: "center", alignItems: "center" }}>
          <AppPhoneMockup variant="home" rotate={-6} style={{ position: "absolute", left: 0, top: 20 }} />
          <AppPhoneMockup variant="booking-confirmed" rotate={6} style={{ position: "absolute", right: 10, top: 0, zIndex: 2 }} />
        </div>
      </div>
    </section>
  );
}

// ----------------- Root -----------------
export default function HomePageClient({
  initialStats,
  initialCategories,
  featuredProviders,
  trending,
}: HomePageClientProps) {
  const router = useRouter();

  const goSearch = (query: string, where: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (where && where !== "Kinshasa") params.set("city", where);
    router.push(`/services${params.toString() ? `?${params.toString()}` : ""}`);
  };
  const openProvider = (id: string) => router.push(`/providers/${id}`);
  const openCategory = (slug: string) => router.push(`/services?category=${slug}`);

  const averageRatingRaw = initialStats?.averageRating;
  const averageRating =
    averageRatingRaw != null
      ? Number.parseFloat(String(averageRatingRaw))
      : null;

  return (
    <Layout>
      <Hero onSearch={goSearch} />
      <TrustStrip
        verifiedProviders={initialStats?.verifiedProviders ?? null}
        averageRating={averageRating != null && Number.isFinite(averageRating) ? averageRating : null}
        cityCount={initialStats?.providersByCity?.length ?? null}
      />
      <TrendingSection trending={trending} onSelect={openCategory} />
      <CategoryGridSection categories={initialCategories} onSelect={openCategory} />
      <FeaturedProvidersSection providers={featuredProviders} onOpen={openProvider} />
      <HowItWorksSection />
      <TestimonialsSection />
      <ProviderCTASection onJoin={() => router.push("/auth?mode=signup")} />
      <AppDownloadCTASection />
    </Layout>
  );
}
