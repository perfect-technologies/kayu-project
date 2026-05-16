"use client";

import { useState } from "react";
import { I } from "@kayu/ui/web";
import { tokens, type CategorySlug } from "@kayu/ui";
import {
  CITIES,
  HOURLY_PRESETS,
  LANGUAGES,
  PRICE_GUIDANCE,
  SKILL_SUGGESTIONS,
  TITLE_SUGGESTIONS,
  YEARS_OPTIONS,
  type OnboardingData,
} from "./types";

type CategoryOption = {
  id: string;
  slug: string;
  name: string;
  subcategories?: Array<{ id: string; name: string; slug?: string; categoryId?: string }>;
};

type StepProps = {
  data: OnboardingData;
  setData: (next: Partial<OnboardingData>) => void;
  categoryOptions?: CategoryOption[];
};

const CATEGORY_SLUGS: CategorySlug[] = [
  "plomberie",
  "electricite",
  "menage",
  "coiffure",
  "informatique",
  "jardinage",
  "peinture",
  "transport",
  "menuiserie",
];

const CATEGORY_KEYWORDS: Array<[CategorySlug, string[]]> = [
  ["plomberie", ["plomb", "sanitaire", "chauffe", "canalisation", "eau"]],
  ["electricite", ["elect", "energie", "snel", "tableau"]],
  ["menage", ["menage", "nettoyage", "entretien"]],
  ["coiffure", ["coiff", "beaute", "barbier"]],
  ["informatique", ["inform", "ordinateur", "reseau", "tech", "it"]],
  ["jardinage", ["jardin", "vert"]],
  ["peinture", ["peint"]],
  ["transport", ["transport", "livraison", "demenagement", "course"]],
  ["menuiserie", ["menuis", "bois", "charp"]],
];

function normalizeCategoryText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_SLUGS.includes(value as CategorySlug);
}

function categoryToTokenSlug(category: CategoryOption): CategorySlug {
  if (isCategorySlug(category.slug)) return category.slug;
  const normalized = normalizeCategoryText(
    `${category.slug} ${category.name} ${(category.subcategories ?? [])
      .map((s) => `${s.id} ${s.name}`)
      .join(" ")}`,
  );
  return (
    CATEGORY_KEYWORDS.find(([, keywords]) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    )?.[0] ?? "informatique"
  );
}

function categoryVisual(category: CategoryOption) {
  return tokens.portfolio[categoryToTokenSlug(category)];
}

function resolveCategoryIds(values: string[], categories: CategoryOption[]) {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of values) {
    const match =
      categories.find((c) => c.id === value) ??
      categories.find((c) => c.slug === value) ??
      categories.find((c) =>
        (c.subcategories ?? []).some(
          (s) =>
            s.id === value ||
            s.slug === value ||
            s.name.toLowerCase() === value.toLowerCase(),
        ),
      ) ??
      categories.find((c) => categoryToTokenSlug(c) === value);
    if (match && !seen.has(match.id)) {
      ids.push(match.id);
      seen.add(match.id);
    }
  }
  return ids.slice(0, 3);
}

function FieldLabel({
  label,
  hint,
  optional,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label
        style={{
          fontFamily: tokens.font.display,
          fontWeight: 600,
          fontSize: 14,
          color: tokens.color.textPrimary,
        }}
      >
        {label}{" "}
        {optional && (
          <span style={{ fontWeight: 400, fontSize: 12, color: tokens.color.textMuted }}>
            (optionnel)
          </span>
        )}
      </label>
      {hint && (
        <div
          style={{
            fontSize: 12,
            color: tokens.color.textMuted,
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function pillStyle(selected: boolean): React.CSSProperties {
  return {
    padding: "8px 13px",
    borderRadius: 999,
    border: selected
      ? `1px solid ${tokens.color.primary}`
      : `1px solid ${tokens.color.border}`,
    background: selected ? tokens.color.primarySubtle : tokens.color.surface,
    color: selected ? tokens.color.primaryHover : tokens.color.textBody,
    fontSize: 13,
    fontWeight: selected ? 700 : 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
}

// ─── Step 1 — Toi & ton métier ────────────────────────────────────────────

export function StepCraft({ data, setData, categoryOptions = [] }: StepProps) {
  const [titleOther, setTitleOther] = useState(false);
  const selectedCategoryIds = resolveCategoryIds(data.categories, categoryOptions);
  const selectedSet = new Set(selectedCategoryIds);
  const limitReached = selectedCategoryIds.length >= 3;

  const titleSuggestions = Array.from(
    new Set(
      selectedCategoryIds.flatMap((id) => {
        const c = categoryOptions.find((o) => o.id === id);
        return c ? (TITLE_SUGGESTIONS[categoryToTokenSlug(c)] ?? []) : [];
      }),
    ),
  );
  const isCustomTitle = data.title.trim().length > 0 && !titleSuggestions.includes(data.title);
  const skillSuggestions = Array.from(
    new Set(
      selectedCategoryIds.flatMap((id) => {
        const c = categoryOptions.find((o) => o.id === id);
        return c ? (SKILL_SUGGESTIONS[categoryToTokenSlug(c)] ?? []) : [];
      }),
    ),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 12,
          borderRadius: tokens.radius.md,
          background: tokens.color.surfaceMuted,
          border: `1px solid ${tokens.color.border}`,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "#F5F2E9",
            color: tokens.color.textMuted,
            fontFamily: tokens.font.mono,
            fontWeight: 700,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {(data.firstName?.[0] || "").toUpperCase()}
          {(data.lastName?.[0] || "").toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: tokens.color.textPrimary }}>
            {data.firstName || data.lastName
              ? `${data.firstName} ${data.lastName}`.trim()
              : "Tes informations"}
          </div>
          <div style={{ fontSize: 12, color: tokens.color.textMuted }}>
            {data.phone ? `+243 ${data.phone}` : "Confirme ton identité ci-dessous"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="k-ob-id">
        <div>
          <FieldLabel label="Prénom" />
          <input
            className="k-input"
            value={data.firstName}
            onChange={(e) => setData({ firstName: e.target.value })}
            placeholder="Jean"
          />
        </div>
        <div>
          <FieldLabel label="Nom" />
          <input
            className="k-input"
            value={data.lastName}
            onChange={(e) => setData({ lastName: e.target.value })}
            placeholder="Mubake"
          />
        </div>
      </div>

      <div>
        <FieldLabel
          label="Numéro de téléphone"
          hint="Utilisé pour les missions et la vérification par SMS."
        />
        <div style={{ display: "flex", gap: 8 }}>
          <div
            className="k-input"
            style={{
              width: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: tokens.font.mono,
              fontWeight: 600,
            }}
          >
            +243
          </div>
          <input
            className="k-input"
            value={data.phone}
            onChange={(e) =>
              setData({ phone: e.target.value.replace(/\D/g, "").slice(0, 9) })
            }
            placeholder="81 234 5678"
            style={{ flex: 1, fontFamily: tokens.font.mono }}
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <FieldLabel
          label="Ton métier"
          hint={`${selectedCategoryIds.length}/3 — choisis jusqu'à trois métiers.`}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categoryOptions.map((category) => {
            const isSel = selectedSet.has(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  if (isSel) {
                    const removed = new Set(
                      category.subcategories?.map((s) => s.id) ?? [],
                    );
                    setData({
                      categories: selectedCategoryIds.filter((id) => id !== category.id),
                      subcategoryIds: data.subcategoryIds.filter(
                        (id) => !removed.has(id),
                      ),
                    });
                    return;
                  }
                  if (limitReached) return;
                  setData({ categories: [...selectedCategoryIds, category.id] });
                }}
                style={{
                  ...pillStyle(isSel),
                  cursor: !isSel && limitReached ? "not-allowed" : "pointer",
                  opacity: !isSel && limitReached ? 0.5 : 1,
                }}
              >
                {isSel && <I.check size={13} />}
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {selectedCategoryIds.length > 0 && (
        <div>
          <FieldLabel
            label="Comment tu te présentes"
            hint="Choisis un intitulé, ou écris le tien."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {titleSuggestions.map((t) => {
              const isSel = !titleOther && !isCustomTitle && data.title === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTitleOther(false);
                    setData({ title: t });
                  }}
                  style={pillStyle(isSel)}
                >
                  {isSel && <I.check size={13} />}
                  {t}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setTitleOther(true);
                if (titleSuggestions.includes(data.title)) setData({ title: "" });
              }}
              style={pillStyle(titleOther || isCustomTitle)}
            >
              Autre…
            </button>
          </div>
          {(titleOther || isCustomTitle) && (
            <input
              className="k-input"
              value={data.title}
              onChange={(e) => setData({ title: e.target.value })}
              placeholder="Ton intitulé d'activité"
              style={{ marginTop: 10 }}
              autoFocus
            />
          )}
        </div>
      )}

      <div>
        <FieldLabel label="Années d'expérience" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {YEARS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setData({ years: r })}
              style={pillStyle(data.years === r)}
            >
              {data.years === r && <I.check size={13} />}
              {r}
            </button>
          ))}
        </div>
      </div>

      {selectedCategoryIds.length > 0 && skillSuggestions.length > 0 && (
        <div>
          <FieldLabel
            label="Compétences"
            optional
            hint="Les clients filtrent par compétence. Ajoute ce qui te correspond."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {skillSuggestions.map((s) => {
              const isSel = data.skills.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setData({
                      skills: isSel
                        ? data.skills.filter((x) => x !== s)
                        : [...data.skills, s],
                    })
                  }
                  style={
                    isSel
                      ? {
                          ...pillStyle(true),
                          background: tokens.color.textPrimary,
                          color: tokens.color.textInverse,
                          border: `1px solid ${tokens.color.textPrimary}`,
                        }
                      : pillStyle(false)
                  }
                >
                  {isSel && <I.check size={12} />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 520px) {
          :global(.k-ob-id) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Step 2 — Où tu interviens ────────────────────────────────────────────

export function StepZones({ data, setData }: StepProps) {
  const toggleCommune = (city: string, commune: string) => {
    const key = `${city}|${commune}`;
    setData({
      zones: data.zones.includes(key)
        ? data.zones.filter((x) => x !== key)
        : [...data.zones, key],
    });
  };
  const selectedCities = new Set(data.zones.map((z) => z.split("|")[0]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <FieldLabel
          label="Communes desservies"
          hint="Choisis au moins une commune. Plus de communes = plus de demandes."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CITIES.map((city) => (
            <div
              key={city.name}
              style={{
                padding: 14,
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: selectedCities.has(city.name)
                  ? tokens.color.primarySubtle
                  : tokens.color.surface,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <I.mapPin size={15} strokeColor={tokens.color.primaryHover} />
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: tokens.color.textPrimary,
                  }}
                >
                  {city.name}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {city.communes.map((c) => {
                  const isSel = data.zones.includes(`${city.name}|${c}`);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCommune(city.name, c)}
                      style={
                        isSel
                          ? {
                              ...pillStyle(true),
                              background: tokens.color.primary,
                              color: tokens.color.textInverse,
                            }
                          : pillStyle(false)
                      }
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: tokens.radius.md,
          background: tokens.color.surfaceMuted,
          border: `1px solid ${tokens.color.borderSubtle}`,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <I.info size={15} strokeColor={tokens.color.textMuted} />
        <div style={{ fontSize: 12.5, color: tokens.color.textBody, lineHeight: 1.5 }}>
          Tu apparais dans les résultats quand un client cherche dans une de tes
          communes sélectionnées.
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Ton prix de départ ──────────────────────────────────────────

function pickGuidance(
  data: OnboardingData,
  categoryOptions: CategoryOption[],
): { min: number; max: number } | null {
  const ids = resolveCategoryIds(data.categories, categoryOptions);
  for (const id of ids) {
    const c = categoryOptions.find((o) => o.id === id);
    if (!c) continue;
    const g = PRICE_GUIDANCE[categoryToTokenSlug(c)];
    if (g) return g;
  }
  return null;
}

export function StepPricing({ data, setData, categoryOptions = [] }: StepProps) {
  const guidance = pickGuidance(data, categoryOptions);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {guidance && (
        <div
          style={{
            padding: 14,
            borderRadius: tokens.radius.md,
            background: tokens.color.surfaceAmber,
            border: "1px solid #FDE68A",
            fontSize: 13,
            color: "#78350F",
            lineHeight: 1.5,
          }}
        >
          À titre indicatif à Kinshasa :{" "}
          <span style={{ fontFamily: tokens.font.mono, fontWeight: 700 }}>
            {guidance.min.toLocaleString("fr-FR")} – {guidance.max.toLocaleString("fr-FR")} FC
          </span>{" "}
          par intervention. Ajustable à tout moment.
        </div>
      )}

      <div>
        <FieldLabel
          label="Prix de départ"
          hint="Affiché sur ton profil sous la forme « À partir de … FC ». Le prix final est convenu avec le client avant l'intervention."
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {HOURLY_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setData({ hourly: p })}
              style={{
                ...pillStyle(data.hourly === p),
                fontFamily: tokens.font.mono,
                fontWeight: 600,
              }}
            >
              {p.toLocaleString("fr-FR")} FC
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <input
            className="k-input"
            type="number"
            value={data.hourly || ""}
            onChange={(e) => setData({ hourly: Math.max(0, +e.target.value) })}
            placeholder="8000"
            style={{
              paddingRight: 56,
              fontFamily: tokens.font.mono,
              fontWeight: 600,
              fontSize: 18,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: tokens.color.textMuted,
              fontFamily: tokens.font.mono,
              fontWeight: 600,
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            FC
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 — Publish preview ─────────────────────────────────────────────

export function StepPublish({ data, setData, categoryOptions = [] }: StepProps) {
  const primaryId = resolveCategoryIds(data.categories, categoryOptions)[0];
  const primaryCategory = categoryOptions.find((c) => c.id === primaryId);
  const profession =
    data.title || (primaryCategory ? primaryCategory.name : "Prestataire");
  const hourly = data.hourly || 0;
  const zoneCommunes = data.zones
    .map((z) => z.split("|")[1])
    .filter(Boolean);
  const initials =
    `${(data.firstName?.[0] || "").toUpperCase()}${(data.lastName?.[0] || "").toUpperCase()}` ||
    "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: tokens.color.primaryHover,
        }}
      >
        Aperçu public
      </div>

      <div
        style={{
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg,
          padding: 16,
          boxShadow: tokens.shadow.e1,
        }}
      >
        <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "#F5F2E9",
              color: tokens.color.textMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: tokens.font.mono,
              fontWeight: 700,
              fontSize: 19,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: tokens.font.display,
                fontWeight: 700,
                fontSize: 17,
                color: tokens.color.textPrimary,
              }}
            >
              {data.firstName || "—"} {data.lastName || ""}
            </div>
            <div style={{ fontSize: 13, color: tokens.color.textMuted, marginTop: 1 }}>
              {profession} · Kinshasa
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
              <span className="k-chip k-chip-sm k-chip-primary">
                <I.sparkles size={12} /> Nouveau
              </span>
              {data.years && <span className="k-chip k-chip-sm">{data.years}</span>}
              {zoneCommunes.length > 0 && (
                <span className="k-chip k-chip-sm">
                  <I.mapPin size={12} />{" "}
                  {zoneCommunes.slice(0, 2).join(", ")}
                  {zoneCommunes.length > 2 ? ` +${zoneCommunes.length - 2}` : ""}
                </span>
              )}
              {data.languages.length > 0 && (
                <span className="k-chip k-chip-sm">{data.languages.join(", ")}</span>
              )}
            </div>
            <div
              style={{
                paddingTop: 12,
                marginTop: 12,
                borderTop: `1px solid ${tokens.color.borderSubtle}`,
              }}
            >
              <span style={{ color: tokens.color.textMuted, fontSize: 13 }}>
                À partir de{" "}
              </span>
              <span
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: 18,
                  fontWeight: 700,
                  color: tokens.color.textPrimary,
                }}
              >
                {hourly.toLocaleString("fr-FR")} FC
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: 16,
          borderRadius: tokens.radius.md,
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
        }}
      >
        <div
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          Juste après la publication
        </div>
        {[
          { icon: "camera" as const, label: "Ajoute ta photo et ton portfolio — c'est ce qui déclenche les demandes" },
          { icon: "shieldCheck" as const, label: "Fais-toi vérifier sous 24h pour le badge « Vérifié »" },
          { icon: "sparkles" as const, label: "Badge « Nouveau » pendant 30 jours pour te lancer" },
        ].map((n, i) => {
          const IconC = I[n.icon];
          return (
            <div
              key={n.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 0",
                color: tokens.color.textBody,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: tokens.color.surfacePrimary,
                  color: tokens.color.primaryHover,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: tokens.font.mono,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
              <IconC size={15} strokeColor={tokens.color.textMuted} />
              {n.label}
            </div>
          );
        })}
      </div>

      <label
        style={{
          display: "flex",
          gap: 10,
          padding: 14,
          borderRadius: tokens.radius.md,
          border: `1px solid ${tokens.color.border}`,
          cursor: "pointer",
          fontSize: 13.5,
          color: tokens.color.textBody,
          lineHeight: 1.45,
        }}
      >
        <input
          type="checkbox"
          checked={data.acceptedTerms}
          onChange={(e) => setData({ acceptedTerms: e.target.checked })}
          style={{ marginTop: 2, accentColor: tokens.color.primary }}
        />
        J'accepte les{" "}
        <a
          style={{
            color: tokens.color.primaryHover,
            fontWeight: 600,
            textDecoration: "underline",
          }}
          href="#"
          onClick={(e) => e.preventDefault()}
        >
          conditions d'utilisation pro
        </a>{" "}
        et le code de conduite KAYOU.
      </label>

      {LANGUAGES.length > 0 && (
        <div>
          <FieldLabel
            label="Langues parlées"
            optional
            hint="Pré-rempli pour Kinshasa. Ajuste si besoin."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LANGUAGES.map((l) => {
              const isSel = data.languages.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() =>
                    setData({
                      languages: isSel
                        ? data.languages.filter((x) => x !== l)
                        : [...data.languages, l],
                    })
                  }
                  style={
                    isSel
                      ? {
                          ...pillStyle(true),
                          background: tokens.color.textPrimary,
                          color: tokens.color.textInverse,
                          border: `1px solid ${tokens.color.textPrimary}`,
                        }
                      : pillStyle(false)
                  }
                >
                  {isSel && <I.check size={12} />}
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
