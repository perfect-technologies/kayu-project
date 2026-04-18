"use client";

import * as React from "react";
import { tokens, type CategorySlug, type ProviderCardData } from "@kayu/ui";
import {
  Avatar,
  Button,
  CategoryTile,
  CategoryTileSkeleton,
  Chip,
  FeaturedProviderCard,
  FeaturedProviderCardSkeleton,
  I,
  Input,
  NearbyCard,
  NearbyCardSkeleton,
  PhotoTile,
  Shimmer,
  ShimmerStyles,
  StarRating,
  TopRatedRibbon,
  TrustChip,
  WideProviderCard,
  WideProviderCardSkeleton,
} from "@kayu/ui/web";

// D01 + D02 smoke-test — renders the v2 token layer and every primitive so we
// can eyeball them on both platforms. Remove after D09 passes.

const COLOR_GROUPS: { title: string; keys: (keyof typeof tokens.color)[] }[] = [
  {
    title: "Surfaces",
    keys: [
      "bg",
      "surface",
      "surfaceMuted",
      "surfacePrimary",
      "surfaceEmerald",
      "surfaceCoral",
      "surfaceAmber",
      "surfaceRose",
      "surfaceExpert",
    ],
  },
  {
    title: "Text",
    keys: ["textPrimary", "textBody", "textMuted", "textSubtle", "textInverse"],
  },
  { title: "Borders", keys: ["border", "borderSubtle", "borderStrong"] },
  {
    title: "Intent",
    keys: [
      "primary",
      "primaryHover",
      "primarySubtle",
      "accent",
      "accentSubtle",
      "success",
      "successSubtle",
      "warning",
      "warningSubtle",
      "danger",
      "dangerSubtle",
      "expert",
      "expertSubtle",
    ],
  },
];

const SAMPLE_PROVIDERS: ProviderCardData[] = [
  {
    id: "p1",
    firstName: "Jean",
    lastName: "Mubake",
    initials: "JM",
    profession: "Plombier certifié",
    commune: "Gombe",
    categories: ["plomberie"],
    avatarBg: "#0EA5E9",
    rating: 4.9,
    reviews: 127,
    response: "15 min",
    hourly: 15000,
    distance: 2.3,
    verified: true,
    topRated: true,
    online: true,
  },
  {
    id: "p2",
    firstName: "Grâce",
    lastName: "Tshilumba",
    initials: "GT",
    profession: "Électricienne",
    commune: "Lemba",
    categories: ["electricite"],
    avatarBg: "#FB7185",
    rating: 4.8,
    reviews: 89,
    response: "1h",
    hourly: 12000,
    distance: 4.1,
    verified: true,
    online: true,
  },
  {
    id: "p3",
    firstName: "Lucie",
    lastName: "Kabasele",
    initials: "LK",
    profession: "Coiffeuse à domicile",
    commune: "Kamalondo",
    categories: ["coiffure"],
    avatarBg: "#F59E0B",
    rating: 4.9,
    reviews: 203,
    response: "20 min",
    hourly: 10000,
    distance: 1.2,
    verified: true,
    topRated: true,
  },
  {
    id: "p4",
    firstName: "Bernadette",
    lastName: "Mupenda",
    initials: "BM",
    profession: "Agent de ménage",
    commune: "Tié-Tié",
    categories: ["menage"],
    avatarBg: "#BE185D",
    rating: 4.8,
    reviews: 156,
    response: "30 min",
    hourly: 5000,
    distance: 2.9,
    verified: true,
  },
];

const SAMPLE_CATEGORIES: { slug: CategorySlug; count: number }[] = [
  { slug: "plomberie", count: 342 },
  { slug: "electricite", count: 218 },
  { slug: "menage", count: 497 },
  { slug: "coiffure", count: 286 },
  { slug: "informatique", count: 164 },
  { slug: "jardinage", count: 129 },
];

const RADII: (keyof typeof tokens.radius)[] = ["sm", "md", "lg", "xl", "xxl"];
const SHADOWS: (keyof typeof tokens.shadow)[] = ["e1", "e2", "e3", "e4", "brand"];
const TYPE: (keyof typeof tokens.size)[] = [
  "displayXL",
  "displayL",
  "displayM",
  "heading",
  "bodyL",
  "body",
  "bodyM",
  "caption",
  "price",
  "overline",
];

export default function DesignProbePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: tokens.color.bg,
        color: tokens.color.textPrimary,
        fontFamily: tokens.font.body,
        padding: 48,
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header style={{ marginBottom: 48 }}>
          <div
            style={{
              fontSize: tokens.size.overline.fontSize,
              fontWeight: tokens.size.overline.weight,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: tokens.color.textMuted,
              marginBottom: 8,
            }}
          >
            KAYOU Design v2 · D01 probe
          </div>
          <h1
            style={{
              fontFamily: tokens.font.display,
              fontSize: tokens.size.displayL.fontSize,
              lineHeight: `${tokens.size.displayL.lineHeight}px`,
              fontWeight: tokens.size.displayL.weight,
              letterSpacing: "-0.028em",
              margin: 0,
            }}
          >
            Trust travels light.
          </h1>
          <p
            style={{
              fontSize: tokens.size.body.fontSize,
              lineHeight: `${tokens.size.body.lineHeight}px`,
              color: tokens.color.textMuted,
              marginTop: 8,
            }}
          >
            Foundations installed. If this renders with Plus Jakarta Sans for
            the heading, Inter here, and JetBrains Mono for{" "}
            <span style={{ fontFamily: tokens.font.mono, fontWeight: 600 }}>
              15 000 FC/h
            </span>
            , fonts are loading correctly.
          </p>
        </header>

        <Section title="Colors">
          {COLOR_GROUPS.map((g) => (
            <div key={g.title} style={{ marginBottom: 32 }}>
              <h3 style={h3Style}>{g.title}</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                {g.keys.map((k) => (
                  <Swatch
                    key={k}
                    name={k}
                    hex={tokens.color[k]}
                    onDark={
                      k === "textPrimary" ||
                      k === "textBody" ||
                      k === "primary" ||
                      k === "primaryHover" ||
                      k === "accent" ||
                      k === "success" ||
                      k === "danger" ||
                      k === "expert"
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Radius">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {RADII.map((r) => (
              <div
                key={r}
                style={{ textAlign: "center", minWidth: 120 }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    background: tokens.color.surface,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius[r],
                    boxShadow: tokens.shadow.e1,
                  }}
                />
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: tokens.font.mono,
                    fontSize: 12,
                    color: tokens.color.textMuted,
                  }}
                >
                  {r} · {tokens.radius[r]}px
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Elevation">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
            {SHADOWS.map((s) => (
              <div
                key={s}
                style={{ textAlign: "center", minWidth: 160 }}
              >
                <div
                  style={{
                    width: 160,
                    height: 120,
                    background: tokens.color.surface,
                    borderRadius: tokens.radius.lg,
                    boxShadow: tokens.shadow[s],
                  }}
                />
                <div
                  style={{
                    marginTop: 12,
                    fontFamily: tokens.font.mono,
                    fontSize: 12,
                    color: tokens.color.textMuted,
                  }}
                >
                  shadow.{s}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type scale">
          <div
            style={{
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.lg,
              padding: 24,
              boxShadow: tokens.shadow.e1,
            }}
          >
            {TYPE.map((t) => {
              const s = tokens.size[t];
              const fam =
                s.family === "display"
                  ? tokens.font.display
                  : s.family === "mono"
                    ? tokens.font.mono
                    : tokens.font.body;
              const sample =
                t === "price"
                  ? "15 000 FC /h"
                  : t === "overline"
                    ? "Top rated cette semaine"
                    : "Trouvez la bonne personne.";
              return (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                    padding: "10px 0",
                    borderBottom: `1px solid ${tokens.color.borderSubtle}`,
                  }}
                >
                  <span
                    style={{
                      flex: "0 0 120px",
                      fontFamily: tokens.font.mono,
                      fontSize: 12,
                      color: tokens.color.textMuted,
                    }}
                  >
                    {t} · {s.fontSize}/{s.lineHeight}
                  </span>
                  <span
                    style={{
                      fontFamily: fam,
                      fontSize: s.fontSize,
                      lineHeight: `${s.lineHeight}px`,
                      fontWeight: s.weight,
                      letterSpacing:
                        "tracking" in s
                          ? `${(s as { tracking: number }).tracking}em`
                          : undefined,
                      textTransform:
                        "transform" in s ? "uppercase" : undefined,
                      color: tokens.color.textPrimary,
                    }}
                  >
                    {sample}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Primitives">
          <ShimmerStyles />

          <h3 style={h3Style}>Button · variants × sizes</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr 1fr 1fr",
              gap: 16,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div />
            <div style={miniHeader}>sm</div>
            <div style={miniHeader}>md</div>
            <div style={miniHeader}>lg</div>
            {(["primary", "secondary", "ghost"] as const).map((v) => (
              <React.Fragment key={v}>
                <div style={miniHeader}>{v}</div>
                {(["sm", "md", "lg"] as const).map((s) => (
                  <div key={s}>
                    <Button variant={v} size={s}>
                      Réserver
                    </Button>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          <h3 style={h3Style}>Button · icons, loading, disabled, fullWidth</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <Button leadingIcon={<I.plus size={16} />}>Ajouter</Button>
            <Button
              variant="secondary"
              trailingIcon={<I.arrowRight size={16} />}
            >
              Continuer
            </Button>
            <Button variant="ghost">Annuler</Button>
            <Button loading>Envoi…</Button>
            <Button disabled>Indisponible</Button>
          </div>
          <Button fullWidth>Pleine largeur</Button>

          <h3 style={{ ...h3Style, marginTop: 28 }}>Input</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 20,
              maxWidth: 720,
              marginBottom: 28,
            }}
          >
            <Input label="Nom" placeholder="Jean Mubake" />
            <Input
              label="Email"
              placeholder="jean@kayou.cd"
              leadingIcon={<I.search size={16} />}
            />
            <Input
              label="Téléphone"
              placeholder="+243 999 000 000"
              helperText="Code envoyé par SMS."
            />
            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              type="password"
              error="Mot de passe trop court (min. 8 caractères)."
            />
          </div>

          <h3 style={h3Style}>Avatar</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <Avatar name="Jean Mubake" size={32} />
            <Avatar name="Grâce Tshilumba" size={48} />
            <Avatar name="Patrick Nzeba" size={64} online />
            <Avatar name="Lucie Kabasele" size={80} ring online />
            <Avatar initials="KB" bg={tokens.color.expert} size={64} />
          </div>

          <h3 style={h3Style}>Chip · variants × sizes</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {(["neutral", "success", "warning", "primary", "accent", "expert"] as const).map(
              (v) => (
                <Chip key={v} variant={v}>
                  {v}
                </Chip>
              ),
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            {(["neutral", "success", "warning", "primary", "accent", "expert"] as const).map(
              (v) => (
                <Chip key={v} size="sm" variant={v}>
                  {v.toUpperCase()}
                </Chip>
              ),
            )}
          </div>

          <h3 style={h3Style}>TrustChip (4 rendered tiers + TOP_RATED=null)</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <TrustChip trust="NEWCOMER" />
            <TrustChip trust="ESTABLISHED" />
            <TrustChip trust="TRUSTED" />
            <TrustChip trust="EXPERT" />
            <span
              style={{
                fontSize: 12,
                color: tokens.color.textMuted,
                fontFamily: tokens.font.mono,
              }}
            >
              TOP_RATED → null (ribbon, see card)
            </span>
          </div>

          <h3 style={h3Style}>Icon · stroke + sizes</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
              color: tokens.color.textPrimary,
              marginBottom: 28,
            }}
          >
            <I.search size={16} />
            <I.search size={20} />
            <I.search size={24} />
            <I.heart size={24} stroke={2} />
            <I.wrench size={24} />
            <I.zap size={24} />
            <I.sparkles size={24} />
            <I.shieldCheck size={24} />
          </div>

          <h3 style={h3Style}>StarRating</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <StarRating value={4.9} count={127} />
            <StarRating value={4.8} count={89} size={16} />
            <StarRating value={5} />
          </div>

          <h3 style={h3Style}>TopRatedRibbon (on a card)</h3>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              width: 240,
              height: 140,
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.xl,
              boxShadow: tokens.shadow.e3,
              marginBottom: 28,
              display: "flex",
              alignItems: "flex-end",
              padding: 16,
            }}
          >
            <TopRatedRibbon />
            <div
              style={{
                fontFamily: tokens.font.mono,
                fontSize: 12,
                color: tokens.color.textMuted,
              }}
            >
              card corner
            </div>
          </div>

          <h3 style={h3Style}>Shimmer</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxWidth: 360,
            }}
          >
            <Shimmer height={18} />
            <Shimmer height={14} width="70%" />
            <Shimmer height={120} radius={tokens.radius.lg} />
          </div>
        </Section>

        <Section title="D03 · Photo-forward cards">
          <h3 style={h3Style}>PhotoTile · 4:5 / 16:11 / 1:1</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "200px 320px 140px",
              gap: 16,
              marginBottom: 28,
              alignItems: "start",
            }}
          >
            <div
              style={{
                borderRadius: tokens.radius.xl,
                overflow: "hidden",
                boxShadow: tokens.shadow.e3,
              }}
            >
              <PhotoTile
                category="plomberie"
                aspect="4/5"
                ariaLabel="Plomberie 4:5"
              />
            </div>
            <div
              style={{
                borderRadius: tokens.radius.xl,
                overflow: "hidden",
                boxShadow: tokens.shadow.e3,
              }}
            >
              <PhotoTile
                category="electricite"
                aspect="16/11"
                ariaLabel="Électricité 16:11"
              />
            </div>
            <div
              style={{
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: tokens.shadow.e1,
              }}
            >
              <PhotoTile
                category="coiffure"
                aspect="1/1"
                ariaLabel="Coiffure 1:1"
                showAmbient={false}
              />
            </div>
          </div>

          <h3 style={h3Style}>FeaturedProviderCard (4:5)</h3>
          <FavoritesPlayground>
            {(favorites, toggle) => (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                {SAMPLE_PROVIDERS.slice(0, 3).map((p) => (
                  <FeaturedProviderCard
                    key={p.id}
                    provider={p}
                    width="100%"
                    favorited={favorites.has(p.id)}
                    onFavorite={toggle}
                    onClick={(id) => console.log("open", id)}
                  />
                ))}
              </div>
            )}
          </FavoritesPlayground>

          <h3 style={h3Style}>WideProviderCard (16:11) — search list</h3>
          <FavoritesPlayground>
            {(favorites, toggle) => (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  maxWidth: 480,
                  marginBottom: 28,
                }}
              >
                {SAMPLE_PROVIDERS.slice(0, 2).map((p) => (
                  <WideProviderCard
                    key={p.id}
                    provider={p}
                    favorited={favorites.has(p.id)}
                    onFavorite={toggle}
                    onClick={(id) => console.log("open", id)}
                  />
                ))}
              </div>
            )}
          </FavoritesPlayground>

          <h3 style={h3Style}>NearbyCard (grouped list)</h3>
          <NearbyCard
            providers={SAMPLE_PROVIDERS}
            onSelect={(id) => console.log("open", id)}
            style={{ maxWidth: 480, marginBottom: 28 }}
          />

          <h3 style={h3Style}>CategoryTile · 6-col grid</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {SAMPLE_CATEGORIES.map((c) => (
              <CategoryTile
                key={c.slug}
                slug={c.slug}
                count={c.count}
                onClick={(slug) => console.log("category", slug)}
              />
            ))}
          </div>

          <h3 style={h3Style}>Skeletons</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <FeaturedProviderCardSkeleton width="100%" />
            <FeaturedProviderCardSkeleton width="100%" />
            <FeaturedProviderCardSkeleton width="100%" />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 480,
              marginBottom: 16,
            }}
          >
            <WideProviderCardSkeleton />
          </div>
          <NearbyCardSkeleton style={{ maxWidth: 480, marginBottom: 16 }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <CategoryTileSkeleton key={i} />
            ))}
          </div>
        </Section>

        <Section title="Three fonts @ 20px">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {(
              [
                ["Plus Jakarta Sans", tokens.font.display],
                ["Inter", tokens.font.body],
                ["JetBrains Mono", tokens.font.mono],
              ] as const
            ).map(([label, fam]) => (
              <div
                key={label}
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  padding: 16,
                  boxShadow: tokens.shadow.e1,
                }}
              >
                <div
                  style={{
                    fontFamily: tokens.font.mono,
                    fontSize: 11,
                    color: tokens.color.textMuted,
                    marginBottom: 8,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: fam,
                    fontSize: 20,
                    lineHeight: "28px",
                    color: tokens.color.textPrimary,
                  }}
                >
                  Mbote Kinshasa 1234567890
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 56 }}>
      <h2
        style={{
          fontFamily: tokens.font.display,
          fontSize: tokens.size.displayM.fontSize,
          lineHeight: `${tokens.size.displayM.lineHeight}px`,
          fontWeight: tokens.size.displayM.weight,
          letterSpacing: "-0.02em",
          margin: "0 0 16px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({
  name,
  hex,
  onDark,
}: {
  name: string;
  hex: string;
  onDark: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: tokens.radius.md,
        background: hex,
        border: `1px solid ${tokens.color.border}`,
        padding: 14,
        height: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: onDark ? "#FFFFFF" : tokens.color.textPrimary,
      }}
    >
      <span
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 11,
          opacity: 0.9,
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {hex}
      </span>
    </div>
  );
}

function FavoritesPlayground({
  children,
}: {
  children: (
    favorites: Set<string>,
    toggle: (id: string) => void,
  ) => React.ReactNode;
}) {
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const toggle = React.useCallback(
    (id: string) =>
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );
  return <>{children(favorites, toggle)}</>;
}

const h3Style: React.CSSProperties = {
  fontFamily: tokens.font.display,
  fontSize: 17,
  fontWeight: 600,
  margin: "0 0 12px",
  color: tokens.color.textBody,
};

const miniHeader: React.CSSProperties = {
  fontFamily: tokens.font.mono,
  fontSize: 11,
  color: tokens.color.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};
