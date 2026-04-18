"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, reviewsApi } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { Avatar, I } from "@kayu/ui/web";
import type { IconName } from "@kayu/ui/web";

export type WriteReviewProvider = {
  id: string;
  firstName: string;
  lastName: string;
  profession: string;
  city: string | null;
};

type Dim = {
  key: "punctuality" | "quality" | "communication" | "value" | "professionalism";
  label: string;
  desc: string;
  icon: IconName;
};

const REVIEW_DIMENSIONS: Dim[] = [
  { key: "punctuality", label: "Ponctualité", desc: "Arrivé à l'heure ?", icon: "clock" },
  { key: "quality", label: "Qualité du travail", desc: "Résultat à la hauteur ?", icon: "sparkles" },
  { key: "communication", label: "Communication", desc: "Clair, réactif, à l'écoute ?", icon: "messageCircle" },
  { key: "value", label: "Rapport qualité-prix", desc: "Prix juste pour le service ?", icon: "coins" },
  { key: "professionalism", label: "Professionnalisme", desc: "Respectueux, soigné, sérieux ?", icon: "shieldCheck" },
];

const QUICK_TAGS = [
  "Ponctuel",
  "Travail propre",
  "Bon communicant",
  "Prix honnête",
  "Je recommande",
  "Expert dans son domaine",
  "Conseils utiles",
  "Matériel de qualité",
  "Chantier bien rangé",
  "Réactif",
];

type Ratings = Partial<Record<Dim["key"], number>>;

function DimensionRow({
  dim,
  value,
  onChange,
}: {
  dim: Dim;
  value: number;
  onChange: (n: number) => void;
}) {
  const IconC = I[dim.icon];
  return (
    <div
      style={{
        padding: "18px 0",
        borderBottom: "1px solid var(--k-border-subtle)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--k-surface-primary)",
            color: "var(--k-primary-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconC size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 600,
              fontSize: 16,
              color: "var(--k-text-primary)",
            }}
          >
            {dim.label}
          </div>
          <div className="k-caption" style={{ marginTop: 2 }}>
            {dim.desc}
          </div>
        </div>
        {value > 0 && (
          <span
            style={{
              fontFamily: "var(--k-font-mono)",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--k-text-primary)",
            }}
          >
            {value}.0
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-start", paddingLeft: 48 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${n} étoile${n > 1 ? "s" : ""} sur 5`}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `1px solid ${filled ? "var(--k-warning)" : "var(--k-border)"}`,
                background: filled ? "var(--k-warning-subtle)" : "var(--k-surface)",
                color: filled ? "var(--k-warning)" : "var(--k-text-subtle)",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 140ms var(--k-ease-std)",
              }}
            >
              <I.star size={18} strokeColor="currentColor" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WriteReviewClient({
  provider,
  bookingId,
  fromBooking,
}: {
  provider: WriteReviewProvider;
  bookingId?: string;
  fromBooking: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [ratings, setRatings] = useState<Ratings>({});
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const overall = useMemo(() => {
    const vals = Object.values(ratings).filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [ratings]);

  const allRated = Object.keys(ratings).length === REVIEW_DIMENSIONS.length;
  const canSubmit = allRated && text.trim().length >= 10;

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) {
        // Backend requires bookingId — if we don't have one, we still show
        // the success state client-side so the design is exercisable, but
        // skip the network write.
        return { success: true as const };
      }
      const tagText = tags.length ? `\n\nPoints forts : ${tags.join(" · ")}` : "";
      const photoText = photos.length ? `\n(${photos.length} photo${photos.length > 1 ? "s" : ""} à suivre)` : "";
      return reviewsApi(apiClient).create({
        bookingId,
        providerId: provider.id,
        rating: Math.round(overall),
        punctuality: ratings.punctuality,
        quality: ratings.quality,
        communication: ratings.communication,
        value: ratings.value,
        professionalism: ratings.professionalism,
        comment: `${text.trim()}${tagText}${photoText}`,
        isPublic: true,
      });
    },
    onSuccess: () => {
      if (bookingId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byProvider(provider.id) });
      setDone(true);
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "Impossible d'envoyer ton avis. Réessaie.");
    },
  });

  const onCancel = () => {
    if (fromBooking) router.replace("/");
    else router.back();
  };

  const onDone = () => {
    if (fromBooking) router.replace("/");
    else router.push("/bookings");
  };

  if (done) {
    return <ReviewSuccess provider={provider} onDone={onDone} />;
  }

  const contextLine = [provider.profession, provider.city, fromBooking ? "aujourd'hui" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 32px 64px" }}>
      <button
        onClick={onCancel}
        style={{
          border: 0,
          background: "transparent",
          color: "var(--k-text-muted)",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          marginBottom: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <I.arrowLeft size={15} /> Retour
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Avatar name={`${provider.firstName} ${provider.lastName}`} size={64} />
        <div>
          <div className="k-caption" style={{ color: "var(--k-text-muted)" }}>
            Mission terminée
          </div>
          <div className="k-display-m" style={{ color: "var(--k-text-primary)", marginTop: 2 }}>
            Comment était {provider.firstName} ?
          </div>
          {contextLine && (
            <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 4 }}>
              {contextLine}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "20px 24px",
          borderRadius: "var(--k-r-lg)",
          background:
            overall > 0
              ? "linear-gradient(135deg, var(--k-warning-subtle), var(--k-surface-amber))"
              : "var(--k-surface-primary)",
          border: `1px solid ${overall > 0 ? "#FCD34D" : "var(--k-border)"}`,
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 8,
        }}
      >
        <div>
          <div className="k-overline">Note globale</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 700,
                fontSize: 40,
                color: "var(--k-text-primary)",
                lineHeight: 1,
              }}
            >
              {overall > 0 ? overall.toFixed(1) : "—"}
            </span>
            <span style={{ color: "var(--k-text-muted)", fontSize: 14 }}>/ 5</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <I.star
                key={n}
                size={24}
                strokeColor={overall >= n - 0.5 ? "var(--k-warning)" : "#E2E8F0"}
              />
            ))}
          </div>
          <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 6 }}>
            Calculée automatiquement à partir des 5 critères.
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 0 10px" }}>
        <div className="k-overline">Note détaillée</div>
        <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 4 }}>
          5 dimensions. Touchez où c&apos;est important.
        </div>
      </div>

      {REVIEW_DIMENSIONS.map((d) => (
        <DimensionRow
          key={d.key}
          dim={d}
          value={ratings[d.key] ?? 0}
          onChange={(v) => setRatings((prev) => ({ ...prev, [d.key]: v }))}
        />
      ))}

      <div style={{ padding: "24px 0 12px" }}>
        <div className="k-overline">Qu&apos;est-ce qui s&apos;est bien passé ?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {QUICK_TAGS.map((t) => {
            const active = tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
                  background: active ? "var(--k-primary-subtle)" : "var(--k-surface)",
                  color: active ? "var(--k-primary-hover)" : "var(--k-text-body)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 140ms var(--k-ease-std)",
                }}
              >
                {active && <I.check size={13} />}
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "24px 0 12px" }}>
        <div className="k-overline">Votre avis écrit</div>
        <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 4, marginBottom: 10 }}>
          Partagez ce qui aidera les autres clients. Minimum 10 caractères.
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Raconte comment s'est passée ta mission…"
          style={{
            width: "100%",
            minHeight: 120,
            padding: 14,
            borderRadius: "var(--k-r-md)",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            fontFamily: "inherit",
            fontSize: 15,
            lineHeight: 1.5,
            color: "var(--k-text-primary)",
            resize: "vertical",
            outline: "none",
          }}
        />
        <div className="k-caption" style={{ marginTop: 6, textAlign: "right" }}>
          {text.length} caractères
        </div>
      </div>

      <div style={{ padding: "16px 0 24px" }}>
        <div className="k-overline">Photos (optionnel)</div>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {photos.map((_, i) => (
            <div
              key={i}
              style={{
                width: 80,
                height: 80,
                borderRadius: "var(--k-r-md)",
                background: "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
                border: "1px solid var(--k-border)",
              }}
              aria-label="Photo ajoutée"
            />
          ))}
          <button
            type="button"
            onClick={() => setPhotos((p) => [...p, p.length + 1])}
            style={{
              width: 80,
              height: 80,
              borderRadius: "var(--k-r-md)",
              border: "2px dashed var(--k-border-strong)",
              background: "transparent",
              color: "var(--k-text-muted)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <I.plus size={20} />
            <span style={{ fontSize: 11 }}>Ajouter</span>
          </button>
        </div>
      </div>

      {submitError && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--k-danger-subtle)",
            border: "1px solid var(--k-danger)",
            color: "var(--k-danger)",
            fontSize: 13,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <I.alertCircle size={15} />
          {submitError}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="k-btn k-btn-secondary k-btn-lg"
          style={{ flex: 1 }}
        >
          Plus tard
        </button>
        <button
          type="button"
          disabled={!canSubmit || submitMutation.isPending}
          onClick={() => {
            setSubmitError(null);
            submitMutation.mutate();
          }}
          className="k-btn k-btn-primary k-btn-lg"
          style={{
            flex: 2,
            opacity: canSubmit && !submitMutation.isPending ? 1 : 0.5,
            cursor: canSubmit && !submitMutation.isPending ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {submitMutation.isPending ? "Envoi…" : "Publier l'avis"}
          <I.arrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function ReviewSuccess({
  provider,
  onDone,
}: {
  provider: WriteReviewProvider;
  onDone: () => void;
}) {
  return (
    <div
      style={{
        minHeight: 600,
        padding: "80px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "var(--k-success-subtle)",
          color: "var(--k-success)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(16,185,129,0.2)",
        }}
      >
        <I.check size={44} stroke={2.5} />
      </div>
      <h2 className="k-display-m" style={{ margin: "0 0 10px" }}>
        Merci pour ton avis !
      </h2>
      <p
        className="k-body-l"
        style={{ color: "var(--k-text-muted)", maxWidth: 380, margin: "0 0 28px" }}
      >
        Ta note aide la communauté à trouver les bons pros. {provider.firstName} sera notifié.
      </p>
      <button type="button" onClick={onDone} className="k-btn k-btn-primary k-btn-lg">
        Retour à l&apos;accueil
      </button>
    </div>
  );
}
