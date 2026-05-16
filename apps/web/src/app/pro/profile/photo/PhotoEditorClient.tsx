"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { I } from "@kayu/ui/web";
import { mediaApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { useAuth } from "@/contexts/AuthContext";

export function PhotoEditorClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(user?.avatar ?? null);
  const [file, setFile] = useState<File | null>(null);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choisis une photo");
      const { path } = await uploadFile("avatar", file);
      return mediaApi(apiClient).setAvatar({ path });
    },
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.strength });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      toast.success("Photo enregistrée.");
      router.push("/pro");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement"),
  });

  const initials = `${(user?.firstName?.[0] ?? "").toUpperCase()}${(
    user?.lastName?.[0] ?? ""
  ).toUpperCase()}` || "?";

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 96px" }}>
      <button
        type="button"
        onClick={() => router.push("/pro")}
        className="k-btn k-btn-ghost k-btn-sm"
        style={{ marginBottom: 14 }}
      >
        <I.arrowLeft size={15} /> Retour
      </button>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          margin: "0 0 16px",
          color: "var(--k-text-primary)",
        }}
      >
        Ta photo de profil
      </h1>

      <div className="k-card" style={{ padding: 18, textAlign: "center" }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            margin: "0 auto 12px",
            background: "#F5F2E9",
            color: "var(--k-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 28,
            overflow: "hidden",
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Aperçu"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setFile(f);
            setPreview(URL.createObjectURL(f));
          }}
        />
        <button
          type="button"
          className="k-btn k-btn-secondary"
          onClick={() => inputRef.current?.click()}
        >
          <I.camera size={16} /> Choisir une photo
        </button>
        <div
          style={{
            marginTop: 12,
            fontSize: 11.5,
            color: "var(--k-text-muted)",
            lineHeight: 1.45,
          }}
        >
          Visage net et bien éclairé, sans lunettes de soleil. Les profils avec
          une vraie photo inspirent confiance.
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          marginTop: 16,
          display: "flex",
          gap: 10,
        }}
      >
        <button
          type="button"
          className="k-btn k-btn-ghost"
          onClick={() => router.push("/pro")}
        >
          Plus tard
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="k-btn k-btn-primary"
          disabled={!file || saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
