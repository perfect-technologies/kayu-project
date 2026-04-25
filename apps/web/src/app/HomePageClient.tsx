"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  BadgeCheck,
  Star,
  Clock,
  ArrowRight,
} from "lucide-react";
import { CategoryTile, FeaturedProviderCard } from "@kayu/ui/web";
import type { ProviderCardData } from "@kayu/ui";
import { Layout } from "@/components/layout";
import { resolveCategorySlug } from "@/lib/provider-card";
import type { PublicStatsResponse } from "@kayu/schemas";

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
}

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
            style={{
              background: "var(--k-surface)",
              border: "1px solid var(--k-border)",
              color: "var(--k-text-muted)",
            }}
          >
            <span
              style={{
                background: "var(--k-success)",
                color: "white",
                borderRadius: 9999,
                padding: "2px 8px",
                fontSize: 10,
                letterSpacing: 0,
              }}
            >
              NOUVEAU
            </span>
            Marketplace #1 de services au Congo
          </div>

          <h1 className="k-display-xl" style={{ margin: "0 0 18px" }}>
            Le bon pro,
            <br />
            <span
              style={{
                background:
                  "linear-gradient(100deg, #0EA5E9 0%, #0EA5E9 40%, #FB7185 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              près de chez toi.
            </span>
          </h1>

          <p
            className="k-body-l"
            style={{ color: "var(--k-text-body)", maxWidth: 580, margin: "0 0 28px" }}
          >
            2 400 pros vérifiés à Kinshasa, Brazzaville, Lubumbashi, Matadi, Pointe-Noire.
            Plombiers, électriciens, coiffeurs, ménage… Réserve en quelques clics.
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
                <span
                  className="k-caption block"
                  style={{ color: "var(--k-text-primary)", fontWeight: 600, marginBottom: 2 }}
                >
                  Quel service ?
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Plomberie, coiffure, ménage…"
                  className="w-full bg-transparent text-[15px] outline-none"
                  style={{ color: "var(--k-text-body)" }}
                />
              </span>
            </label>
            <div style={{ width: 1, height: 40, background: "var(--k-border)" }} />
            <label className="flex flex-1 items-center gap-3 px-5 py-3.5">
              <MapPin className="h-5 w-5" style={{ color: "var(--k-text-muted)" }} />
              <span className="flex-1">
                <span
                  className="k-caption block"
                  style={{ color: "var(--k-text-primary)", fontWeight: 600, marginBottom: 2 }}
                >
                  Où ?
                </span>
                <input
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  className="w-full bg-transparent text-[15px] outline-none"
                  style={{ color: "var(--k-text-body)" }}
                />
              </span>
            </label>
            <button
              type="submit"
              className="k-btn k-btn-primary"
              style={{ height: 56, padding: "0 28px", fontSize: 16 }}
            >
              <Search className="h-[18px] w-[18px]" />
              Rechercher
            </button>
          </form>

          <div
            className="mt-5 flex flex-wrap gap-8"
            style={{ color: "var(--k-text-muted)" }}
          >
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" style={{ color: "var(--k-success)" }} />
              <span className="k-body-m">
                <b className="k-num" style={{ color: "var(--k-text-primary)" }}>
                  2 400
                </b>{" "}
                pros vérifiés
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" style={{ color: "var(--k-warning)" }} />
              <span className="k-body-m">
                <b className="k-num" style={{ color: "var(--k-text-primary)" }}>
                  4.8
                </b>{" "}
                moyenne
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: "var(--k-primary)" }} />
              <span className="k-body-m">
                Réponse en{" "}
                <b className="k-num" style={{ color: "var(--k-text-primary)" }}>
                  ~1h
                </b>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryGrid({
  categories,
  onSelect,
}: {
  categories: Category[];
  onSelect: (slug: string) => void;
}) {
  const cats = categories.slice(0, 6);
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-10 md:px-10">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="k-display-m" style={{ margin: 0 }}>
          Trouve ton métier
        </h2>
        <Link href="/services" className="k-btn k-btn-ghost">
          Toutes les catégories <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {cats.length === 0 ? (
        <div
          className="rounded-[var(--k-r-lg)] p-6 text-center text-sm"
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            color: "var(--k-text-muted)",
          }}
        >
          Chargement des catégories…
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-6">
          {cats.map((c) => (
            <CategoryTile
              key={c.id}
              slug={resolveCategorySlug(c.slug)}
              label={c.name}
              count={c.providersCount}
              size="lg"
              onClick={() => onSelect(c.slug)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedProviders({
  providers,
  onOpen,
}: {
  providers: ProviderCardData[];
  onOpen: (id: string) => void;
}) {
  const top = providers.slice(0, 3);
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-10 md:px-10">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <div
            className="k-overline"
            style={{ color: "var(--k-accent)", marginBottom: 6 }}
          >
            Top rated cette semaine
          </div>
          <h2 className="k-display-m" style={{ margin: 0 }}>
            Pros vérifiés à Kinshasa
          </h2>
        </div>
        <Link href="/services" className="k-btn k-btn-ghost">
          Voir tous les pros <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {top.length === 0 ? (
        <EmptyFeatured />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {top.map((p) => (
            <FeaturedProviderCard
              key={p.id}
              provider={p}
              width="100%"
              onClick={() => onOpen(p.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyFeatured() {
  return (
    <div
      className="rounded-[var(--k-r-lg)] p-8 text-center"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
      }}
    >
      <p className="k-body" style={{ color: "var(--k-text-muted)", margin: 0 }}>
        Les pros arrivent bientôt. Reviens plus tard ou explore les catégories.
      </p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Trouve un prestataire",
      desc: "Cherche par métier, ville et disponibilité pour ouvrir un profil utile.",
      icon: Search,
    },
    {
      n: "02",
      title: "Discute directement",
      desc: "Appelle ou envoie un message pour confirmer le besoin, le prix et l'adresse.",
      icon: BadgeCheck,
    },
    {
      n: "03",
      title: "Réserve et paie en espèces",
      desc: "Le pro envoie l'offre finale après discussion. Paiement en espèces à la fin de la mission.",
      icon: Clock,
    },
  ];
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-[1240px] px-5 py-12 md:px-10"
    >
      <h2 className="k-display-m" style={{ marginBottom: 32 }}>
        Comment ça marche
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.n}
            className="relative pt-7"
            style={{ borderTop: "2px solid var(--k-border)" }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -2,
                left: 0,
                width: i === 0 ? "100%" : i === 1 ? "50%" : "0%",
                height: 2,
                background: "var(--k-primary)",
              }}
            />
            <div className="mb-3.5 flex items-center gap-3.5">
              <div
                style={{
                  fontFamily: "var(--k-font-mono)",
                  fontWeight: 600,
                  fontSize: 28,
                  color: "var(--k-primary)",
                }}
              >
                {s.n}
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                style={{
                  background: "var(--k-primary-subtle)",
                  color: "var(--k-primary-hover)",
                }}
              >
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="k-heading mb-2">{s.title}</div>
            <div className="k-body" style={{ color: "var(--k-text-body)" }}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProviderCTA({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="px-5 py-12 md:px-10 md:py-20">
      <div
        className="relative mx-auto grid max-w-[1240px] items-center gap-10 overflow-hidden p-8 md:grid-cols-[1.2fr_1fr] md:p-14"
        style={{
          borderRadius: "var(--k-r-xl)",
          background:
            "linear-gradient(120deg, #FFF1F2 0%, #FFE4E6 60%, #FFFBEB 100%)",
          border: "1px solid #FECDD3",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: -100,
            top: -80,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,113,133,0.25), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="relative">
          <div className="k-overline" style={{ color: "#BE123C", marginBottom: 12 }}>
            Pour les pros
          </div>
          <h3 className="k-display-l" style={{ margin: "0 0 14px" }}>
            Tu es un pro&nbsp;? <br className="hidden md:inline" />
            Rejoins KAYOU.
          </h3>
          <p
            className="k-body-l"
            style={{ color: "#9F1239", margin: "0 0 22px", maxWidth: 460 }}
          >
            Crée ton profil, reçois des messages et réservations directes, construis ta réputation.
            Zéro frais d&apos;inscription.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button className="k-btn k-btn-primary k-btn-lg" onClick={onJoin}>
              Devenir pro <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/#how-it-works" className="k-btn k-btn-ghost k-btn-lg">
              En savoir plus
            </Link>
          </div>
        </div>

        <div className="relative flex justify-end">
          <div
            className="k-card w-[280px] p-5"
            style={{ boxShadow: "var(--k-e3)" }}
          >
            <div className="k-caption">Revenus ce mois</div>
            <div
              style={{
                fontFamily: "var(--k-font-mono)",
                fontWeight: 600,
                fontSize: 32,
                marginTop: 4,
                color: "var(--k-text-primary)",
              }}
            >
              842 500{" "}
              <span style={{ fontSize: 14, color: "var(--k-text-muted)" }}>FC</span>
            </div>
            <div
              className="mt-1 flex items-center gap-1.5"
              style={{ color: "var(--k-success)" }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>↑ +23%</span>
              <span className="k-caption">vs mois dernier</span>
            </div>
            <div className="mt-4 flex h-14 items-end gap-1">
              {[32, 48, 38, 56, 42, 64, 72].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: h,
                    background:
                      i === 6 ? "var(--k-primary)" : "var(--k-primary-subtle)",
                    borderRadius: 4,
                  }}
                />
              ))}
            </div>
            <div className="k-caption mt-2">7 derniers jours</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePageClient({
  initialCategories,
  featuredProviders,
}: HomePageClientProps) {
  const router = useRouter();

  const goSearch = (query: string, where: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (where && where !== "Kinshasa") params.set("city", where);
    router.push(`/services${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const openProvider = (id: string) => router.push(`/providers/${id}`);

  const openCategory = (slug: string) =>
    router.push(`/services?category=${slug}`);

  return (
    <Layout>
      <Hero onSearch={goSearch} />
      <CategoryGrid categories={initialCategories} onSelect={openCategory} />
      <FeaturedProviders providers={featuredProviders} onOpen={openProvider} />
      <HowItWorks />
      <ProviderCTA onJoin={() => router.push("/auth?mode=signup")} />
    </Layout>
  );
}
