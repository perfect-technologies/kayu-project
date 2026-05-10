"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, queryKeys } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { CategoryForm, CategoryFormValues } from "../_components/CategoryForm";
import { SubcategoryList } from "../_components/SubcategoryList";
import {
  PersistedSubcategory,
  SubcategoryDraftValues,
} from "../_components/SubcategoryRow";
import { DeleteConfirmDialog } from "../_components/DeleteConfirmDialog";

type Props = { categoryId: string };

export function CategoryDetailClient({ categoryId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: queryKeys.admin.category(categoryId),
    queryFn: () => adminApi(apiClient).getCategory(categoryId),
  });

  const [categorySaveError, setCategorySaveError] = React.useState<string | null>(null);
  const [draftSaveError, setDraftSaveError] = React.useState<string | null>(null);
  const [rowSaveErrors, setRowSaveErrors] = React.useState<Record<string, string | null>>({});
  const [rowDeleteErrors, setRowDeleteErrors] = React.useState<Record<string, string | null>>({});
  const [confirmDeleteCategory, setConfirmDeleteCategory] = React.useState(false);

  const invalidateBoth = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.category(categoryId) });
  }, [queryClient, categoryId]);

  const updateCategoryMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      adminApi(apiClient).updateCategory({
        categoryId,
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        icon: values.icon || undefined,
        image: values.image || undefined,
        color: values.color || undefined,
        order: values.order,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      setCategorySaveError(null);
      invalidateBoth();
      toast.success("Catégorie enregistrée");
    },
    onError: (err: Error) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setCategorySaveError(message);
      toast.error(message);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: () => adminApi(apiClient).deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      toast.success("Catégorie supprimée");
      setConfirmDeleteCategory(false);
      router.push("/dashboard/admin?tab=categories");
    },
    onError: (err: Error) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setCategorySaveError(message);
      toast.error(message);
      setConfirmDeleteCategory(false);
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: (values: SubcategoryDraftValues) =>
      adminApi(apiClient).createSubcategory({
        categoryId,
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        icon: values.icon || undefined,
        order: values.order,
      }),
    onMutate: () => setDraftSaveError(null),
    onSuccess: () => {
      invalidateBoth();
      toast.success("Sous-catégorie ajoutée");
    },
    onError: (err: Error) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setDraftSaveError(message);
      toast.error(message);
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SubcategoryDraftValues }) =>
      adminApi(apiClient).updateSubcategory({
        id,
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        icon: values.icon || undefined,
        order: values.order,
        isActive: values.isActive,
      }),
    onSuccess: (_data, vars) => {
      setRowSaveErrors((current) => ({ ...current, [vars.id]: null }));
      invalidateBoth();
      toast.success("Sous-catégorie enregistrée");
    },
    onError: (err: Error, vars) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setRowSaveErrors((current) => ({ ...current, [vars.id]: message }));
      toast.error(message);
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: (id: string) => adminApi(apiClient).deleteSubcategory(id),
    onSuccess: (_data, id) => {
      setRowDeleteErrors((current) => ({ ...current, [id]: null }));
      invalidateBoth();
      toast.success("Sous-catégorie supprimée");
    },
    onError: (err: Error, id) => {
      const message = err.message || "Une erreur est survenue, réessayez.";
      setRowDeleteErrors((current) => ({ ...current, [id]: message }));
      toast.error(message);
    },
  });

  const reorderSubcategoriesMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; order: number }>) => {
      await Promise.all(
        updates.map((u) =>
          adminApi(apiClient).updateSubcategory({ id: u.id, order: u.order }),
        ),
      );
    },
    onSuccess: () => {
      invalidateBoth();
    },
    onError: (err: Error) => {
      const message = err.message || "Réorganisation impossible.";
      toast.error(message);
      // Re-fetch so the UI snaps back to the server's truth.
      invalidateBoth();
    },
  });

  if (detailQuery.isLoading) {
    return <DetailSkeleton />;
  }
  if (detailQuery.isError || !detailQuery.data?.category) {
    return (
      <div style={{ padding: 24 }}>
        <Link
          href="/dashboard/admin?tab=categories"
          style={{ fontSize: 13, color: "var(--k-text-muted)" }}
        >
          ← Retour à la liste
        </Link>
        <div
          style={{
            marginTop: 24,
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            borderRadius: 12,
            padding: 28,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Catégorie introuvable</h2>
          <p style={{ fontSize: 13, color: "var(--k-text-muted)", marginTop: 8 }}>
            La catégorie demandée n&apos;existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  const category = detailQuery.data.category;
  const initialFormValues: CategoryFormValues = {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    icon: category.icon ?? "",
    image: category.image ?? "",
    color: category.color ?? "",
    order: category.order,
    isActive: category.isActive,
  };

  const subcategories: PersistedSubcategory[] = category.subcategories.map((sub) => ({
    id: sub.id,
    categoryId: sub.categoryId,
    name: sub.name,
    slug: sub.slug,
    description: sub.description ?? "",
    icon: sub.icon ?? "",
    order: sub.order,
    isActive: sub.isActive,
  }));

  const updateVars = updateSubcategoryMutation.variables;
  const pendingSaveId = updateSubcategoryMutation.isPending && updateVars
    ? updateVars.id
    : null;
  const pendingDeleteId = deleteSubcategoryMutation.isPending
    ? deleteSubcategoryMutation.variables ?? null
    : null;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12.5,
          color: "var(--k-text-muted)",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/dashboard/admin?tab=categories"
          className="inline-flex items-center gap-1"
          style={{ color: "var(--k-text-muted)" }}
        >
          <ChevronLeft size={14} /> Retour à la liste
        </Link>
        <span>·</span>
        <span>Admin › Catégories › {category.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryForm
          initialValues={initialFormValues}
          isSaving={updateCategoryMutation.isPending}
          isDeleting={deleteCategoryMutation.isPending}
          saveError={categorySaveError}
          onSave={(values) => updateCategoryMutation.mutate(values)}
          onDelete={() => setConfirmDeleteCategory(true)}
        />

        <SubcategoryList
          subcategories={subcategories}
          pendingSaveId={pendingSaveId}
          pendingDeleteId={pendingDeleteId}
          rowSaveErrors={rowSaveErrors}
          rowDeleteErrors={rowDeleteErrors}
          isCreating={createSubcategoryMutation.isPending}
          draftSaveError={draftSaveError}
          onCreate={(values, onDone) =>
            createSubcategoryMutation.mutate(values, {
              onSuccess: () => onDone(),
            })
          }
          onUpdate={(id, values) =>
            updateSubcategoryMutation.mutate({ id, values })
          }
          onDelete={(id) => deleteSubcategoryMutation.mutate(id)}
          onReorder={(orderedIds) => {
            const updates = orderedIds
              .map((id, index) => {
                const current = subcategories.find((s) => s.id === id);
                if (!current) return null;
                if (current.order === index) return null;
                return { id, order: index };
              })
              .filter((u): u is { id: string; order: number } => u !== null);
            if (updates.length > 0) {
              reorderSubcategoriesMutation.mutate(updates);
            }
          }}
        />
      </div>

      <DeleteConfirmDialog
        open={confirmDeleteCategory}
        onOpenChange={setConfirmDeleteCategory}
        title="Supprimer la catégorie"
        description={`La catégorie "${category.name}" sera définitivement supprimée. Si des prestataires y sont associés, la suppression sera bloquée.`}
        confirmLabel="Supprimer la catégorie"
        isPending={deleteCategoryMutation.isPending}
        onConfirm={() => deleteCategoryMutation.mutate()}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          height: 14,
          width: 160,
          background: "var(--k-border)",
          borderRadius: 4,
          marginBottom: 16,
        }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          style={{
            height: 480,
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            borderRadius: 12,
          }}
        />
        <div
          style={{
            height: 480,
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            borderRadius: 12,
          }}
        />
      </div>
    </div>
  );
}
