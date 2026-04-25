"use client";

import { I } from "@kayu/ui/web";
import { tokens, type CategorySlug } from "@kayu/ui";
import {
  CITIES,
  LANGUAGES,
  PAYMENT_OPTIONS,
  SKILL_SUGGESTIONS,
  YEARS_OPTIONS,
  type OnboardingData,
} from "./types";

type StepProps = {
  data: OnboardingData;
  setData: (next: Partial<OnboardingData>) => void;
};

const CATEGORY_LIST: CategorySlug[] = [
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

export function FieldLabel({
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
          <span
            style={{
              fontWeight: 400,
              fontSize: 12,
              color: tokens.color.textMuted,
            }}
          >
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

// ─── Step 1 — Identité ────────────────────────────────────────────────────

export function StepIdentity({ data, setData }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          padding: 16,
          borderRadius: tokens.radius.md,
          background: tokens.color.surfacePrimary,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          border: "1px solid #BAE6FD",
        }}
      >
        <I.shieldCheck size={20} strokeColor={tokens.color.primaryHover} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              color: tokens.color.primaryHover,
              fontSize: 14,
            }}
          >
            Pourquoi on vérifie
          </div>
          <div
            style={{
              fontSize: 13,
              color: tokens.color.textBody,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            Les clients KAYOU choisissent en confiance. Ton identité vérifiée
            débloque le badge « Vérifié » sur ton profil.
          </div>
        </div>
      </div>

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
      <div>
        <FieldLabel
          label="Numéro de téléphone"
          hint="Utilisé pour les missions et la vérification par SMS."
        />
        <div style={{ display: "flex", gap: 8 }}>
          <div
            className="k-input"
            style={{
              width: 84,
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
          label="Pièce d'identité"
          hint="Carte d'électeur, passeport ou permis. Stockée de façon sécurisée."
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {(
            [
              { k: "front", label: "Recto" },
              { k: "back", label: "Verso" },
            ] as const
          ).map((s) => {
            const done = Boolean(data.id?.[s.k]);
            return (
              <button
                key={s.k}
                type="button"
                onClick={() =>
                  setData({ id: { ...data.id, [s.k]: !done } })
                }
                style={{
                  padding: "22px 12px",
                  borderRadius: tokens.radius.md,
                  border: done
                    ? `2px solid ${tokens.color.success}`
                    : `2px dashed ${tokens.color.borderStrong}`,
                  background: done
                    ? tokens.color.successSubtle
                    : tokens.color.surface,
                  cursor: "pointer",
                  textAlign: "center",
                  color: done ? tokens.color.success : tokens.color.textMuted,
                  transition: "all 160ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              >
                {done ? <I.check size={22} /> : <I.plus size={22} />}
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>
                  {s.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 — Métier ──────────────────────────────────────────────────────

export function StepCraft({ data, setData }: StepProps) {
  const primary = data.categories[0];
  const suggestions = primary ? (SKILL_SUGGESTIONS[primary] ?? []) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <FieldLabel
          label="Catégorie principale"
          hint="Tu pourras en ajouter plus tard."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          {CATEGORY_LIST.map((slug) => {
            const p = tokens.portfolio[slug];
            const IconC =
              (I as Record<string, React.FC<{ size?: number }>>)[p.iconName] ??
              I.wrench;
            const isSel = data.categories.includes(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() =>
                  setData({ categories: isSel ? [] : [slug] })
                }
                style={{
                  padding: 14,
                  borderRadius: tokens.radius.md,
                  border: isSel
                    ? `2px solid ${p.accent}`
                    : `2px solid ${tokens.color.border}`,
                  background: isSel ? p.bg : tokens.color.surface,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  transition: "all 140ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: p.bg,
                    color: p.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconC size={18} />
                </div>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: tokens.color.textPrimary,
                  }}
                >
                  {p.label}
                </span>
                {isSel && (
                  <I.check
                    size={16}
                    strokeColor={p.accent}
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel
          label="Intitulé de métier"
          hint="Ex : Plombier certifié, Électricienne agréée SNEL…"
        />
        <input
          className="k-input"
          value={data.title}
          onChange={(e) => setData({ title: e.target.value })}
          placeholder="Plombier certifié"
        />
      </div>

      <div>
        <FieldLabel label="Années d'expérience" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {YEARS_OPTIONS.map((r) => {
            const isSel = data.years === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setData({ years: r })}
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: isSel
                    ? `1px solid ${tokens.color.primary}`
                    : `1px solid ${tokens.color.border}`,
                  background: isSel
                    ? tokens.color.primarySubtle
                    : tokens.color.surface,
                  color: isSel
                    ? tokens.color.primaryHover
                    : tokens.color.textBody,
                  fontWeight: 500,
                  fontSize: 13.5,
                  cursor: "pointer",
                }}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel
          label="Compétences"
          optional
          hint={
            primary
              ? "Ajoute 3 à 8 spécialités. Les clients filtrent par compétence."
              : "Choisis d'abord une catégorie pour voir les suggestions."
          }
        />
        {suggestions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {suggestions.map((s) => {
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
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: isSel
                      ? `1px solid ${tokens.color.textPrimary}`
                      : `1px solid ${tokens.color.border}`,
                    background: isSel
                      ? tokens.color.textPrimary
                      : tokens.color.surface,
                    color: isSel
                      ? tokens.color.textInverse
                      : tokens.color.textBody,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {isSel && <I.check size={12} />}
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <FieldLabel
          label="Décrivez brièvement votre savoir-faire"
          optional
          hint="Un court paragraphe visible sur ton profil public."
        />
        <textarea
          value={data.bio}
          onChange={(e) => setData({ bio: e.target.value.slice(0, 500) })}
          placeholder="Plombier indépendant depuis 2018, spécialisé en chauffe-eau et fuites sous évier."
          style={{
            width: "100%",
            minHeight: 96,
            padding: 14,
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            fontFamily: "inherit",
            fontSize: 14.5,
            lineHeight: 1.5,
            outline: "none",
            resize: "vertical",
          }}
        />
        <div
          style={{
            fontSize: 11,
            color: tokens.color.textMuted,
            marginTop: 4,
            textAlign: "right",
            fontFamily: tokens.font.mono,
          }}
        >
          {data.bio.length} / 500
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Zones ───────────────────────────────────────────────────────

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
  const clampedRadius = Math.min(20, Math.max(1, data.radius));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <FieldLabel
          label="Rayon d'intervention"
          hint={`Actuel : ${clampedRadius} km autour de tes communes.`}
        />
        <input
          type="range"
          min={1}
          max={20}
          value={clampedRadius}
          onChange={(e) => setData({ radius: +e.target.value })}
          style={{ width: "100%", accentColor: tokens.color.primary }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: tokens.color.textMuted,
            marginTop: 2,
            fontFamily: tokens.font.mono,
          }}
        >
          <span>1 km</span>
          <span>{clampedRadius} km</span>
          <span>20 km</span>
        </div>
      </div>

      <div>
        <FieldLabel
          label="Communes desservies"
          hint="Choisis au moins une commune. Sélectionne plusieurs villes si tu te déplaces."
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
                transition: "background 140ms cubic-bezier(0.2, 0, 0, 1)",
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
                <I.mapPin
                  size={15}
                  strokeColor={tokens.color.primaryHover}
                />
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
                  const key = `${city.name}|${c}`;
                  const isSel = data.zones.includes(key);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCommune(city.name, c)}
                      style={{
                        padding: "7px 11px",
                        borderRadius: 999,
                        border: isSel
                          ? `1px solid ${tokens.color.primary}`
                          : `1px solid ${tokens.color.border}`,
                        background: isSel
                          ? tokens.color.primary
                          : tokens.color.surface,
                        color: isSel
                          ? tokens.color.textInverse
                          : tokens.color.textBody,
                        fontSize: 12.5,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
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
        <div
          style={{
            fontSize: 12.5,
            color: tokens.color.textBody,
            lineHeight: 1.5,
          }}
        >
          Tu apparais dans les résultats quand un client cherche dans une de tes
          communes sélectionnées.
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 — Tarifs ──────────────────────────────────────────────────────

const HOURLY_PRESETS = [5000, 8000, 12000, 15000];

export function StepPricing({ data, setData }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          padding: 16,
          borderRadius: tokens.radius.md,
          background: tokens.color.surfaceAmber,
          border: "1px solid #FDE68A",
          display: "flex",
          gap: 12,
        }}
      >
        <I.coins size={20} strokeColor="#B45309" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#92400E", fontSize: 14 }}>
            Tarif moyen à Kinshasa
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#78350F",
              marginTop: 2,
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontFamily: tokens.font.mono, fontWeight: 700 }}>
              12 000 – 18 000 FC
            </span>{" "}
            / heure. Tu peux ajuster à tout moment.
          </div>
        </div>
      </div>

      <div>
        <FieldLabel
          label="Tarif horaire"
          hint="Prix que tu affiches. Les clients voient toujours un total estimé avant de réserver."
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {HOURLY_PRESETS.map((p) => {
            const isSel = data.hourly === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setData({ hourly: p })}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: isSel
                    ? `1px solid ${tokens.color.primary}`
                    : `1px solid ${tokens.color.border}`,
                  background: isSel
                    ? tokens.color.primarySubtle
                    : tokens.color.surface,
                  color: isSel
                    ? tokens.color.primaryHover
                    : tokens.color.textBody,
                  fontFamily: tokens.font.mono,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {p.toLocaleString("fr-FR")} FC
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative" }}>
          <input
            className="k-input"
            type="number"
            value={data.hourly || ""}
            onChange={(e) => setData({ hourly: Math.max(0, +e.target.value) })}
            placeholder="15000"
            style={{
              paddingRight: 80,
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
            FC / h
          </div>
        </div>
      </div>

      <div>
        <FieldLabel
          label="Déplacement"
          hint="Frais fixes pour te rendre chez le client."
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {(
            [
              { k: "free", label: "Gratuit", sub: "Dans ma zone" },
              { k: "fixed", label: "Forfait", sub: "5 000 FC" },
            ] as const
          ).map((o) => {
            const isSel = data.travelMode === o.k;
            return (
              <button
                key={o.k}
                type="button"
                onClick={() => setData({ travelMode: o.k })}
                style={{
                  padding: 14,
                  borderRadius: tokens.radius.md,
                  border: isSel
                    ? `2px solid ${tokens.color.primary}`
                    : `2px solid ${tokens.color.border}`,
                  background: isSel
                    ? tokens.color.primarySubtle
                    : tokens.color.surface,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: tokens.color.textPrimary,
                  }}
                >
                  {o.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: tokens.color.textMuted,
                    marginTop: 2,
                  }}
                >
                  {o.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel
          label="Paiement Mobile Money"
          hint="Comment tu reçois tes paiements."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PAYMENT_OPTIONS.map((o) => {
            const isSel = data.payment === o.k;
            return (
              <button
                key={o.k}
                type="button"
                onClick={() => setData({ payment: o.k })}
                style={{
                  padding: "14px 16px",
                  borderRadius: tokens.radius.md,
                  border: isSel
                    ? `1px solid ${o.color}`
                    : `1px solid ${tokens.color.border}`,
                  background: isSel ? "#FAFAF9" : tokens.color.surface,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: o.color,
                    color: tokens.color.textInverse,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: tokens.font.mono,
                  }}
                >
                  {o.label[0]}
                </div>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  {o.label}
                </span>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `2px solid ${isSel ? o.color : tokens.color.borderStrong}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSel && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: o.color,
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 5 — Profil ──────────────────────────────────────────────────────

export function StepProfile({ data, setData }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <FieldLabel
          label="Photo de profil"
          optional
          hint="Le téléversement de photo arrive avec la prochaine version. Vous pourrez ajouter votre portrait depuis votre profil après la publication."
        />
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            padding: 14,
            borderRadius: tokens.radius.md,
            background: tokens.color.surfaceMuted,
            border: `1px dashed ${tokens.color.borderStrong}`,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: tokens.color.surface,
              color: tokens.color.textSubtle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <I.user size={24} />
          </div>
          <div
            style={{
              fontSize: 13,
              color: tokens.color.textMuted,
              lineHeight: 1.5,
            }}
          >
            Votre profil se publie sans photo pour le lancement. Les clients voient
            un avatar neutre jusqu'à ce que l'upload soit activé.
          </div>
        </div>
      </div>

      <div>
        <FieldLabel
          label="À propos de moi"
          hint="2–3 phrases. Qu'est-ce qui fait ta différence ?"
        />
        <textarea
          value={data.bio}
          onChange={(e) => setData({ bio: e.target.value.slice(0, 500) })}
          placeholder="Plombier depuis 2018, formé à l'INPP Kinshasa. Je réponds en moins de 30 min et garantis mes interventions."
          style={{
            width: "100%",
            minHeight: 110,
            padding: 14,
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            fontFamily: "inherit",
            fontSize: 14.5,
            lineHeight: 1.5,
            outline: "none",
            resize: "vertical",
          }}
        />
        <div
          style={{
            fontSize: 11,
            color: tokens.color.textMuted,
            marginTop: 4,
            textAlign: "right",
            fontFamily: tokens.font.mono,
          }}
        >
          {data.bio.length} / 500
        </div>
      </div>

      <div>
        <FieldLabel
          label="Langues parlées"
          optional
          hint="Indique les langues dans lesquelles tu peux échanger."
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
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: isSel
                    ? `1px solid ${tokens.color.textPrimary}`
                    : `1px solid ${tokens.color.border}`,
                  background: isSel
                    ? tokens.color.textPrimary
                    : tokens.color.surface,
                  color: isSel
                    ? tokens.color.textInverse
                    : tokens.color.textBody,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isSel && <I.check size={12} />}
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel
          label="Portfolio"
          optional
          hint="Photos de tes chantiers terminés. 3 à 8 photos recommandé."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}
        >
          {[0, 1, 2, 3].map((i) => {
            const filled = i < data.portfolio;
            return (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setData({
                    portfolio: Math.min(4, (data.portfolio || 0) + 1),
                  })
                }
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 10,
                  background: filled
                    ? `linear-gradient(135deg, ${["#0EA5E9", "#10B981", "#F59E0B", "#FB7185"][i]}, #fff)`
                    : tokens.color.surfaceMuted,
                  border: filled
                    ? "none"
                    : `2px dashed ${tokens.color.borderStrong}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: tokens.color.textMuted,
                }}
              >
                {!filled && <I.plus size={20} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 6 — Publish ─────────────────────────────────────────────────────

export function StepPublish({ data, setData }: StepProps) {
  const primary = data.categories[0];
  const cat = primary ? tokens.portfolio[primary] : tokens.portfolio.plomberie;
  const hourly = data.hourly || 15000;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          padding: 18,
          borderRadius: tokens.radius.lg,
          background: `linear-gradient(135deg, ${tokens.color.surfacePrimary}, ${tokens.color.surface})`,
          border: "1px solid #BAE6FD",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: tokens.color.primaryHover,
          }}
        >
          Aperçu de ton profil
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 12,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${cat.accent}, ${tokens.color.primaryHover})`,
              color: tokens.color.textInverse,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: tokens.font.display,
              fontWeight: 700,
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            {(data.firstName?.[0] || "J").toUpperCase()}
            {(data.lastName?.[0] || "M").toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: tokens.font.display,
                fontWeight: 600,
                fontSize: 18,
                color: tokens.color.textPrimary,
              }}
            >
              {data.firstName || "Jean"} {data.lastName || "Mubake"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: tokens.color.textMuted,
                marginTop: 2,
              }}
            >
              {data.title || cat.label}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 10,
              }}
            >
              <span className="k-chip k-chip-sm k-chip-success">
                <I.badgeCheck size={12} /> Nouveau · Vérifié
              </span>
              <span className="k-chip k-chip-sm">
                <I.award size={12} /> {data.years || "—"}
              </span>
              <span className="k-chip k-chip-sm">
                <I.mapPin size={12} /> {data.zones.length || 0} zones
              </span>
            </div>
            {data.bio && (
              <p
                style={{
                  fontSize: 13,
                  color: tokens.color.textBody,
                  marginTop: 12,
                  lineHeight: 1.5,
                }}
              >
                {data.bio}
              </p>
            )}
            <div
              style={{
                paddingTop: 12,
                marginTop: 12,
                borderTop: `1px solid ${tokens.color.borderSubtle}`,
              }}
            >
              <span
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: 18,
                  fontWeight: 600,
                  color: tokens.color.textPrimary,
                }}
              >
                {hourly.toLocaleString("fr-FR")} FC
              </span>
              <span
                style={{ color: tokens.color.textMuted, fontSize: 14 }}
              >
                {" "}
                /heure
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
          Prochaines étapes après publication
        </div>
        {[
          { icon: "check" as const, label: "Profil vérifié sous 24h" },
          {
            icon: "sparkles" as const,
            label: "Badge « Nouveau » pendant 30 jours",
          },
          {
            icon: "award" as const,
            label: "Débloque « De confiance » après 10 missions notées",
          },
        ].map((n) => {
          const IconC = I[n.icon];
          return (
            <div
              key={n.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                color: tokens.color.textBody,
                fontSize: 13.5,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: tokens.color.surfacePrimary,
                  color: tokens.color.primaryHover,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconC size={13} />
              </div>
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
    </div>
  );
}
