"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "./slug";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewCategoryModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi(apiClient).createCategory({
        name: name.trim(),
        slug: slug.trim(),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      toast.success("Catégorie créée");
      onOpenChange(false);
      const newId = response?.category?.id;
      if (newId) {
        router.push(`/dashboard/admin/categories/${newId}`);
      }
    },
    onError: (err: Error) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setError(message);
      toast.error(message);
    },
  });

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !slug.trim()) {
      setError("Nom et slug sont obligatoires.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie</DialogTitle>
          <DialogDescription>
            Saisissez le nom et le slug. Vous pourrez compléter description, icône, image, couleur et sous-catégories sur la page suivante.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--k-text-body)" }}>Nom *</span>
            <input
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
              autoFocus
              style={{
                width: "100%",
                marginTop: 4,
                padding: "8px 10px",
                border: "1px solid var(--k-border)",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
          </label>
          <label className="block">
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--k-text-body)" }}>Slug *</span>
            <input
              type="text"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              required
              style={{
                width: "100%",
                marginTop: 4,
                padding: "8px 10px",
                border: "1px solid var(--k-border)",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "var(--k-font-mono)",
              }}
            />
          </label>
          {error ? (
            <div style={{ fontSize: 12.5, color: "var(--k-danger)" }}>{error}</div>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              style={{
                padding: "8px 14px",
                border: "1px solid var(--k-border)",
                borderRadius: 8,
                background: "white",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "var(--k-primary)",
                color: "white",
                fontWeight: 600,
              }}
            >
              {mutation.isPending ? "Création…" : "Créer"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
