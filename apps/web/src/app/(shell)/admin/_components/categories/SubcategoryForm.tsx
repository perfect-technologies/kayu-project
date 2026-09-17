"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@kayu/api";
import type { AdminCategoryNode, AdminCreateSubcategoryDto, AdminUpdateSubcategoryDto } from "@kayu/schemas";
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

export type SubcategoryFormProps = {
  open: boolean;
  onClose: () => void;
  /** Level-1 category the node belongs to. */
  categoryId: string;
  /** Level-2 parent when creating or editing a level-3 service; null for a level-2 node. */
  parent: AdminCategoryNode | null;
  /** Node being edited; null creates. */
  node: AdminCategoryNode | null;
};

type Draft = { name: string; slug: string; description: string; icon: string; order: string; isActive: boolean };

function fromNode(node: AdminCategoryNode | null): Draft {
  return { name: node?.name ?? "", slug: node?.slug ?? "", description: node?.description ?? "", icon: node?.icon ?? "", order: String(node?.order ?? 0), isActive: node?.isActive ?? true };
}

/** Create or edit a level-2 or level-3 node (name, slug, icon, order, active); nodes never move. */
export function SubcategoryForm({ open, onClose, categoryId, parent, node }: SubcategoryFormProps) {
  const [draft, setDraft] = useState<Draft>(() => fromNode(node));
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isService = parent !== null || node?.level === 3;

  useEffect(() => {
    if (open) {
      setDraft(fromNode(node));
      setSlugTouched(node !== null);
      setError(null);
    }
  }, [open, node]);

  const save = useAdminMutation({
    mutationFn: (dto: AdminUpdateSubcategoryDto) =>
      node ? adminApi(apiClient).updateSubcategory(node.id, dto) : adminApi(apiClient).createSubcategory({ ...(dto as AdminCreateSubcategoryDto), categoryId, parentId: parent?.id ?? null }),
    invalidate: INVALIDATE,
    success: node ? copy.toasts.updated : copy.toasts.created,
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
        order: Number(draft.order) || 0,
        isActive: draft.isActive,
      });
    } catch (cause) {
      setError(adminErrorMessage(cause));
    }
  };

  const title = node ? copy.editNode : isService ? copy.newService : copy.newSubcategory;
  return (
    <ConfirmSheet open={open} onClose={onClose} title={title} confirmLabel={node ? adminCopy.common.save : adminCopy.common.create} busy={save.isPending} disabled={draft.name.trim().length < 2 || draft.slug.trim().length < 2} onConfirm={() => void submit()} error={error}>
      {parent && !node && <p className="text-xs text-muted-foreground">{copy.parent} : <span className="font-semibold text-foreground">{parent.name}</span></p>}
      <Field label={copy.name} required value={draft.name} maxLength={120} onChange={(event) => patch({ name: event.target.value, ...(slugTouched ? {} : { slug: slugify(event.target.value) }) })} />
      <Field label={adminCopy.common.slug} required value={draft.slug} maxLength={120} pattern="[a-z0-9_-]+" onChange={(event) => { setSlugTouched(true); patch({ slug: event.target.value }); }} />
      <TextAreaField label={adminCopy.common.description} value={draft.description} rows={2} maxLength={500} onChange={(event) => patch({ description: event.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <LucideIconPicker label={adminCopy.common.icon} value={draft.icon} onChange={(icon) => patch({ icon })} />
        <Field label={adminCopy.common.order} type="number" min={0} max={10000} value={draft.order} onChange={(event) => patch({ order: event.target.value })} />
      </div>
      <ToggleRow label={copy.active} checked={draft.isActive} onChange={(isActive) => patch({ isActive })} />
    </ConfirmSheet>
  );
}
