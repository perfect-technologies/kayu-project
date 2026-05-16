"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { I } from "@kayu/ui/web";
import { providersApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";

export function PortfolioListClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.providers.portfolio,
    queryFn: () => providersApi(apiClient).listPortfolio(),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => providersApi(apiClient).deletePortfolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.portfolio });
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.strength });
      toast.success("Chantier supprimé.");
    },
  });

  const projects = data?.projects ?? [];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 96px" }}>
      <button
        type="button"
        onClick={() => router.push("/pro")}
        className="k-btn k-btn-ghost k-btn-sm"
        style={{ marginBottom: 14 }}
      >
        <I.arrowLeft size={15} /> Retour
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 22,
            margin: 0,
            color: "var(--k-text-primary)",
          }}
        >
          Ton portfolio
        </h1>
        <Link href="/pro/profile/portfolio/new" className="k-btn k-btn-primary k-btn-sm">
          <I.plus size={15} /> Ajouter un chantier
        </Link>
      </div>

      {isLoading ? (
        <div className="k-card" style={{ padding: 24, textAlign: "center", color: "var(--k-text-muted)" }}>
          Chargement…
        </div>
      ) : projects.length === 0 ? (
        <div className="k-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--k-text-primary)" }}>
            Montre ton travail
          </div>
          <div style={{ fontSize: 13, color: "var(--k-text-muted)", lineHeight: 1.5, marginBottom: 14 }}>
            Un bon chantier : une photo avant, une photo après, une description
            courte. 3 chantiers avec photos avant/après → profil remarquable.
          </div>
          <Link href="/pro/profile/portfolio/new" className="k-btn k-btn-primary">
            Ajoute ton premier chantier
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {projects.map((p) => (
            <div key={p.id} className="k-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 4,
                    width: 132,
                    flexShrink: 0,
                  }}
                >
                  {p.images.slice(0, 3).map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.imageUrl}
                      alt={p.title}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        borderRadius: 6,
                        background: "var(--k-surface-muted)",
                      }}
                    />
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--k-text-primary)" }}>
                    {p.title}
                  </div>
                  {p.description && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--k-text-muted)",
                        marginTop: 3,
                        lineHeight: 1.45,
                      }}
                    >
                      {p.description}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => delMut.mutate(p.id)}
                    disabled={delMut.isPending}
                    className="k-btn k-btn-ghost k-btn-sm"
                    style={{ marginTop: 8, color: "var(--k-danger)" }}
                  >
                    <I.trash size={14} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
