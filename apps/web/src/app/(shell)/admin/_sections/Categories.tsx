"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import type { AdminCategoryNode } from "@kayu/schemas";
import { Layers, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ConfirmAction } from "../_components/ConfirmAction";
import { QueryState } from "../_components/QueryState";
import { SectionTitle } from "../_components/SectionTitle";
import { AdminCategoriesList } from "../_components/categories/AdminCategoriesList";
import { NewCategoryModal } from "../_components/categories/NewCategoryModal";
import { SubcategoryForm } from "../_components/categories/SubcategoryForm";
import { useAdminMutation } from "../_components/useAdminMutation";

const copy = adminCopy.categories;
const INVALIDATE = [["admin", "categories"], ["admin", "subcategories"], ["categories"]] as const;

type Sheet =
  | { kind: "category"; node: AdminCategoryNode | null }
  | { kind: "node"; categoryId: string; parent: AdminCategoryNode | null; node: AdminCategoryNode | null }
  | null;

function findNode(tree: AdminCategoryNode[], id: string | null): AdminCategoryNode | null {
  if (!id) return null;
  for (const node of tree) {
    if (node.id === id) return node;
    const child = findNode(node.children, id);
    if (child) return child;
  }
  return null;
}

function NodeActions({ node, onEdit, onToggle, onDelete }: { node: AdminCategoryNode; onEdit: () => void; onToggle: () => Promise<unknown>; onDelete: () => Promise<unknown> }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onEdit} className="secondary-action h-9 px-3 text-xs">
        <Pencil size={14} aria-hidden /> {adminCopy.common.edit}
      </button>
      {node.isActive ? (
        <ConfirmAction className="h-9 px-3 text-xs" sheet={{ title: copy.sheets.deactivate.title, description: copy.sheets.deactivate.description, confirmLabel: copy.sheets.deactivate.confirm }} onConfirm={onToggle}>
          <Power size={14} aria-hidden /> {copy.deactivate}
        </ConfirmAction>
      ) : (
        <button type="button" onClick={() => void onToggle()} className="secondary-action h-9 px-3 text-xs text-emerald-700">
          <Power size={14} aria-hidden /> {copy.activate}
        </button>
      )}
      <ConfirmAction className="h-9 px-3 text-xs" destructive sheet={{ title: copy.sheets.delete.title, description: copy.sheets.delete.description, confirmLabel: copy.sheets.delete.confirm }} onConfirm={onDelete}>
        <Trash2 size={14} aria-hidden /> {copy.delete}
      </ConfirmAction>
    </div>
  );
}

function Column({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-border bg-white p-3", className)}>
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground">
      <Plus size={14} aria-hidden /> {label}
    </button>
  );
}

/** Three-level tree editor: categories › subcategories › services, one column per level. */
export function Categories() {
  const query = useQuery({ queryKey: queryKeys.admin.categories, queryFn: () => adminApi(apiClient).categories() });
  const tree = query.data?.items ?? [];
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const category = findNode(tree, categoryId);
  const sub = category ? findNode(category.children, subId) : null;

  const toggle = useAdminMutation({
    mutationFn: (node: AdminCategoryNode) => (node.level === 1 ? adminApi(apiClient).updateCategory(node.id, { isActive: !node.isActive }) : adminApi(apiClient).updateSubcategory(node.id, { isActive: !node.isActive })),
    invalidate: INVALIDATE,
    success: (_result, node) => (node.isActive ? copy.toasts.deactivated : copy.toasts.activated),
  });
  const remove = useAdminMutation({
    mutationFn: (node: AdminCategoryNode) => (node.level === 1 ? adminApi(apiClient).deleteCategory(node.id) : adminApi(apiClient).deleteSubcategory(node.id)),
    invalidate: INVALIDATE,
    success: copy.toasts.deleted,
    onSuccess: (_result, node) => {
      if (node.id === categoryId) setCategoryId(null);
      if (node.id === subId) setSubId(null);
    },
  });

  const actions = (node: AdminCategoryNode) => (
    <NodeActions
      node={node}
      onEdit={() => setSheet(node.level === 1 ? { kind: "category", node } : { kind: "node", categoryId: node.categoryId ?? categoryId ?? "", parent: node.level === 3 ? sub : null, node })}
      onToggle={() => toggle.mutateAsync(node)}
      onDelete={() => remove.mutateAsync(node)}
    />
  );

  return (
    <section>
      <SectionTitle title={copy.title} subtitle={copy.subtitle} action={<AddButton label={copy.newCategory} onClick={() => setSheet({ kind: "category", node: null })} />} />
      <QueryState isLoading={query.isLoading} isError={query.isError} onRetry={() => void query.refetch()} isEmpty={tree.length === 0} empty={{ icon: Layers, title: copy.noChildren }}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Column title={copy.level1}>
            <AdminCategoriesList nodes={tree} selectedId={categoryId} swatch onSelect={(node) => { setCategoryId(node.id); setSubId(null); }} />
            {category && <div className="mt-3 border-t border-border pt-3">{actions(category)}</div>}
          </Column>
          <Column title={copy.level2} action={category && <AddButton label={copy.newSubcategory} onClick={() => setSheet({ kind: "node", categoryId: category.id, parent: null, node: null })} />}>
            {category ? (
              <>
                <AdminCategoriesList nodes={category.children} selectedId={subId} onSelect={(node) => setSubId(node.id)} />
                {sub && <div className="mt-3 border-t border-border pt-3">{actions(sub)}</div>}
              </>
            ) : (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">{copy.selectCategory}</p>
            )}
          </Column>
          <Column title={copy.level3} action={sub && category && <AddButton label={copy.newService} onClick={() => setSheet({ kind: "node", categoryId: category.id, parent: sub, node: null })} />}>
            {sub ? (
              <ul className="space-y-1.5">
                {[...sub.children]
                  .sort((a, b) => a.order - b.order)
                  .map((service) => (
                    <li key={service.id} className={cn("rounded-2xl border border-border bg-white p-3", !service.isActive && "opacity-60")}>
                      <p className="flex items-center gap-2 text-sm font-bold">
                        <span className="truncate">{service.name}</span>
                        <span className="text-[10px] text-muted-foreground">#{service.order}</span>
                        {!service.isActive && <span className="status-pill h-5 px-2 text-[10px]">{adminCopy.common.inactive}</span>}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{service.slug} · {copy.counts(service.counts)}</p>
                      <div className="mt-2">{actions(service)}</div>
                    </li>
                  ))}
                {sub.children.length === 0 && <li className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">{copy.noChildren}</li>}
              </ul>
            ) : (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">{copy.selectSubcategory}</p>
            )}
          </Column>
        </div>
      </QueryState>
      <NewCategoryModal open={sheet?.kind === "category"} category={sheet?.kind === "category" ? sheet.node : null} onClose={() => setSheet(null)} />
      <SubcategoryForm
        open={sheet?.kind === "node"}
        onClose={() => setSheet(null)}
        categoryId={sheet?.kind === "node" ? sheet.categoryId : ""}
        parent={sheet?.kind === "node" ? sheet.parent : null}
        node={sheet?.kind === "node" ? sheet.node : null}
      />
    </section>
  );
}
