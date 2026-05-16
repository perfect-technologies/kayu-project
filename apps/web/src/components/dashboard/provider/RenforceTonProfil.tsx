"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { providersApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";

const TASK_HREF: Record<string, string> = {
  photo: "/pro/profile/photo",
  portfolio: "/pro/profile/portfolio",
  description: "/pro/profile/presentation",
  verification: "/pro/verify",
  depth: "/pro/profile/presentation",
};

const TASK_CTA: Record<string, string> = {
  photo: "Ajouter",
  portfolio: "Commencer",
  description: "Rédiger",
  verification: "Envoyer",
  depth: "Compléter",
};

const TASK_REASON: Record<string, string> = {
  photo: "Les clients réservent les visages qu'ils voient.",
  portfolio: "Tes photos avant/après transforment une visite en demande.",
  description: "Une bonne présentation rassure et convertit.",
  verification: "Débloque le badge « Vérifié » — un signal de confiance fort.",
  depth: "Plus de langues, compétences et zones = plus de visibilité.",
};

const TIER_LABEL: Record<string, string> = {
  base: "Profil de base",
  solide: "Profil solide",
  remarquable: "Profil remarquable",
};

export function RenforceTonProfil() {
  const { data } = useQuery({
    queryKey: queryKeys.providers.strength,
    queryFn: () => providersApi(apiClient).getStrength(),
  });

  if (!data) return null;
  if (data.tier === "remarquable") {
    return (
      <section
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          padding: 14,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--k-success)",
          fontWeight: 600,
          fontSize: 13.5,
        }}
      >
        <I.checkCircle size={18} strokeColor="var(--k-success)" /> Profil remarquable ✓
      </section>
    );
  }

  const todo = data.items.filter((i) => !i.done);

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 16,
        marginBottom: 14,
        boxShadow: "var(--k-e2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 15,
            color: "var(--k-text-primary)",
          }}
        >
          Renforce ton profil
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--k-primary-hover)",
            background: "var(--k-surface-primary)",
            border: "1px solid var(--k-border)",
            borderRadius: "var(--k-r-pill)",
            padding: "3px 10px",
          }}
        >
          {TIER_LABEL[data.tier]}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={data.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Score du profil"
        style={{
          height: 9,
          borderRadius: "var(--k-r-pill)",
          background: "var(--k-surface-muted)",
          overflow: "hidden",
          margin: "2px 0 4px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${data.score}%`,
            background: "var(--k-primary)",
            borderRadius: "var(--k-r-pill)",
            transition: "width 240ms var(--k-ease-std)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--k-text-subtle)",
          marginBottom: 12,
        }}
      >
        <span>Base</span>
        <span>Solide</span>
        <span>Remarquable</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 0",
          borderBottom: "1px solid var(--k-border-subtle)",
          color: "var(--k-text-body)",
          fontSize: 13,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--k-success-subtle)",
            color: "var(--k-success)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <I.check size={13} />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "var(--k-text-primary)" }}>
            Tes essentiels sont en ligne
          </div>
          <div style={{ fontSize: 11.5, color: "var(--k-text-muted)" }}>
            Métier, zone et prix — tu es visible dans les recherches.
          </div>
        </div>
      </div>

      {todo.map((item, idx) => (
        <div
          key={item.key}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 11,
            padding: "11px 0",
            borderBottom:
              idx === todo.length - 1
                ? "none"
                : "1px solid var(--k-border-subtle)",
          }}
        >
          <div
            style={{
              width: 25,
              height: 25,
              borderRadius: "50%",
              background: "var(--k-surface-muted)",
              color: "var(--k-text-muted)",
              border: "1px solid var(--k-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {idx + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--k-text-primary)",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                marginTop: 2,
                lineHeight: 1.45,
              }}
            >
              {TASK_REASON[item.key]}
            </div>
          </div>
          <Link
            href={TASK_HREF[item.key]}
            style={{
              alignSelf: "center",
              flexShrink: 0,
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--k-primary)",
              textDecoration: "none",
            }}
          >
            {TASK_CTA[item.key]} ›
          </Link>
        </div>
      ))}
    </section>
  );
}
