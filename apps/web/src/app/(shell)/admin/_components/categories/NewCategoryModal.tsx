"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@kayu/api";
import type { AdminCategoryNode, AdminCreateCategoryDto } from "@kayu/schemas";
import { Field, TextAreaField } from "@/components/forms/Field";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { adminErrorMessage } from "../admin-errors";
import { ToggleRow } from "../ToggleRow";
import { useAdminMutation } from "../useAdminMutation";
import { LucideIconPicker } from "./LucideIconPicker";
import { slugify } from "./slug";

const copy = adminCopy.categories;
const INVALIDATE = [["admin", "categories"], ["admin", "subcategories"], ["categories"]] as const;

type Draft = { name: string; slug: string; description: string; icon: string; color: string; order: string; isActive: boolean };

function fromNode(node: AdminCategoryNode | null): Draft {
  return { name: node?.name ?? "", slug: node?.slug ?? "", description: node?.description ?? "", icon: node?.icon ?? "", color: node?.color ?? "", order: String(node?.order ?? 0), isActive: node?.isActive ?? true };
}

/** Create (`category` null) or edit a level-1 category in a sheet; the slug follows the name until edited. */
export function NewCategoryModal({ open, category, onClose }: { open: boolean; category: AdminCategoryNode | null; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => fromNode(category));
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(fromNode(category));
      setSlugTouched(category !== null);
      setError(null);
    }
  }, [open, category]);

  const save = useAdminMutation({
    mutationFn: (dto: AdminCreateCategoryDto) => (category ? adminApi(apiClient).updateCategory(category.id, dto) : adminApi(apiClient).createCategory(dto)),
    invalidate: INVALIDATE,
    success: category ? copy.toasts.updated : copy.toasts.created,
    onSuccess: onClose,
    silent: true,
  });

  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));
  const submit = async () => {
    setError(null);
    try {
      await save.mutateAsync({
        name: draft.name.trim(),
        slug: draft.slug.trim(),
        description: draft.description.trim() || undefined,
        icon: draft.icon || undefined,
        color: draft.color.trim() || undefined,
        order: Number(draft.order) || 0,
        isActive: draft.isActive,
      });
    } catch (cause) {
      setError(adminErrorMessage(cause));
    }
  };

  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title={category ? copy.editCategory : copy.newCategory}
      confirmLabel={category ? adminCopy.common.save : adminCopy.common.create}
      busy={save.isPending}
      disabled={draft.name.trim().length < 2 || draft.slug.trim().length < 2}
      onConfirm={() => void submit()}
      error={error}
    >
      <Field label={copy.name} required value={draft.name} maxLength={120} onChange={(event) => patch({ name: event.target.value, ...(slugTouched ? {} : { slug: slugify(event.target.value) }) })} />
      <Field label={adminCopy.common.slug} required value={draft.slug} maxLength={120} pattern="[a-z0-9_-]+" onChange={(event) => { setSlugTouched(true); patch({ slug: event.target.value }); }} />
      <TextAreaField label={adminCopy.common.description} value={draft.description} rows={2} maxLength={500} onChange={(event) => patch({ description: event.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <LucideIconPicker label={adminCopy.common.icon} value={draft.icon} onChange={(icon) => patch({ icon })} />
        <Field label={adminCopy.common.color} value={draft.color} maxLength={60} hint={copy.colorHint} onChange={(event) => patch({ color: event.target.value })} />
      </div>
      <Field label={adminCopy.common.order} type="number" min={0} max={10000} value={draft.order} onChange={(event) => patch({ order: event.target.value })} />
      <ToggleRow label={copy.active} checked={draft.isActive} onChange={(isActive) => patch({ isActive })} />
    </ConfirmSheet>
  );
}
