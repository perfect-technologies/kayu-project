"use client";

import { Briefcase } from "lucide-react";
import type { CategoryTreeNode } from "@kayu/schemas";
import { SelectField } from "@/components/forms/Field";
import { onboardingCopy } from "@/copy/onboarding";
import { providerCopy } from "@/copy/provider";

const copy = onboardingCopy.services;

export type CategorySelection = { categoryId: string; subcategoryId: string; serviceId: string };

export type CategoryCascadeProps = {
  tree: CategoryTreeNode[];
  value: CategorySelection;
  onChange: (next: CategorySelection) => void;
  error?: string | null;
  disabled?: boolean;
};

/** Catégorie › Sous-catégorie › Service selects cascading from `GET /categories/tree`. */
export function CategoryCascade({ tree, value, onChange, error, disabled }: CategoryCascadeProps) {
  const category = tree.find((node) => node.id === value.categoryId) ?? null;
  const subcategory = category?.children.find((node) => node.id === value.subcategoryId) ?? null;
  const services = subcategory?.children ?? [];
  const choose = providerCopy.references.choose;

  return (
    <div className="space-y-4">
      <SelectField
        label={copy.category}
        required
        disabled={disabled}
        icon={<Briefcase size={18} aria-hidden />}
        value={value.categoryId}
        error={error && !value.categoryId ? error : null}
        onChange={(event) => onChange({ categoryId: event.target.value, subcategoryId: "", serviceId: "" })}
      >
        <option value="">{choose}</option>
        {tree.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={copy.subcategory}
          required
          disabled={disabled || !category}
          value={value.subcategoryId}
          error={error && value.categoryId && !value.subcategoryId ? error : null}
          onChange={(event) => onChange({ ...value, subcategoryId: event.target.value, serviceId: "" })}
        >
          <option value="">{choose}</option>
          {(category?.children ?? []).map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={copy.service}
          required={services.length > 0}
          disabled={disabled || services.length === 0}
          value={value.serviceId}
          error={error && value.subcategoryId && services.length > 0 && !value.serviceId ? error : null}
          onChange={(event) => onChange({ ...value, serviceId: event.target.value })}
        >
          <option value="">{choose}</option>
          {services.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </SelectField>
      </div>
    </div>
  );
}

/** Level-1 › level-2 › level-3 ids for a stored `subcategoryId` (any level), for the editor. */
export function selectionForNode(tree: CategoryTreeNode[], nodeId: string | null | undefined): CategorySelection {
  if (!nodeId) return { categoryId: "", subcategoryId: "", serviceId: "" };
  for (const root of tree) {
    if (root.id === nodeId) return { categoryId: root.id, subcategoryId: "", serviceId: "" };
    for (const sub of root.children) {
      if (sub.id === nodeId) return { categoryId: root.id, subcategoryId: sub.id, serviceId: "" };
      for (const service of sub.children) {
        if (service.id === nodeId) return { categoryId: root.id, subcategoryId: sub.id, serviceId: service.id };
      }
    }
  }
  return { categoryId: "", subcategoryId: "", serviceId: "" };
}
