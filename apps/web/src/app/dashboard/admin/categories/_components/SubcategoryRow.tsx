"use client";

import * as React from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { LucideIconPicker } from "./LucideIconPicker";
import { slugify } from "./slug";

export type SubcategoryDraftValues = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
};

export type PersistedSubcategory = SubcategoryDraftValues & {
  id: string;
  categoryId: string;
};

type DragHandleProps = {
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
  attributes?: Record<string, unknown>;
  listeners?: Record<string, unknown>;
};

export type SubcategoryRowProps =
  | ({
      mode: "persisted";
      initialValues: PersistedSubcategory;
      isSaving: boolean;
      isDeleting: boolean;
      saveError: string | null;
      deleteError: string | null;
      onSave: (values: SubcategoryDraftValues) => void;
      onDelete: () => void;
    } & DragHandleProps)
  | {
      mode: "draft";
      isSaving: boolean;
      saveError: string | null;
      onSave: (values: SubcategoryDraftValues) => void;
      onCancel: () => void;
    };

const EMPTY_DRAFT: SubcategoryDraftValues = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  order: 0,
  isActive: true,
};

export function SubcategoryRow(props: SubcategoryRowProps) {
  const initial: SubcategoryDraftValues =
    props.mode === "persisted"
      ? {
          name: props.initialValues.name,
          slug: props.initialValues.slug,
          description: props.initialValues.description,
          icon: props.initialValues.icon,
          order: props.initialValues.order,
          isActive: props.initialValues.isActive,
        }
      : EMPTY_DRAFT;

  const [values, setValues] = React.useState<SubcategoryDraftValues>(initial);
  const [slugTouched, setSlugTouched] = React.useState(false);

  const persistedKey =
    props.mode === "persisted" ? props.initialValues.id : null;

  React.useEffect(() => {
    setValues(initial);
    setSlugTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedKey]);

  const isDirty = React.useMemo(() => {
    return (Object.keys(values) as Array<keyof SubcategoryDraftValues>).some(
      (key) => values[key] !== initial[key],
    );
  }, [values, initial]);

  function update<K extends keyof SubcategoryDraftValues>(
    key: K,
    value: SubcategoryDraftValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(name: string) {
    setValues((current) =>
      slugTouched
        ? { ...current, name }
        : { ...current, name, slug: slugify(name) },
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        props.onSave(values);
      }}
      style={{
        background: "var(--k-surface-muted)",
        border: "1px solid var(--k-border)",
        borderRadius: 8,
        padding: "16px 10px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {props.mode === "persisted" ? (
          <button
            ref={
              props.setActivatorNodeRef
                ? (node) => props.setActivatorNodeRef?.(node)
                : undefined
            }
            type="button"
            aria-label="Réorganiser"
            title="Glisser pour réorganiser"
            {...(props.attributes ?? {})}
            {...(props.listeners ?? {})}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 28,
              border: "none",
              background: "transparent",
              color: "var(--k-text-subtle)",
              cursor: "grab",
              touchAction: "none",
            }}
          >
            <GripVertical size={14} />
          </button>
        ) : null}
        <input
          type="text"
          value={values.name}
          onChange={(event) => handleNameChange(event.target.value)}
          required
          placeholder="Nom"
          style={{ ...inputStyle, flex: 1 }}
        />
        <input
          type="text"
          value={values.slug}
          onChange={(event) => {
            setSlugTouched(true);
            update("slug", event.target.value);
          }}
          required
          placeholder="slug"
          style={{ ...inputStyle, flex: 1, fontFamily: "var(--k-font-mono)" }}
        />
      </div>

      <LucideIconPicker
        value={values.icon}
        onChange={(next) => update("icon", next)}
      />

      <input
        type="text"
        value={values.description}
        onChange={(event) => update("description", event.target.value)}
        placeholder="Description"
        style={inputStyle}
      />

      {props.saveError ? (
        <div style={{ fontSize: 11.5, color: "var(--k-danger)" }}>
          {props.saveError}
        </div>
      ) : null}
      {props.mode === "persisted" && props.deleteError ? (
        <div style={{ fontSize: 11.5, color: "var(--k-danger)" }}>
          {props.deleteError}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--k-text-body)",
            whiteSpace: "nowrap",
          }}
        >
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) => update("isActive", event.target.checked)}
          />
          Active
        </label>
        <div style={{ display: "flex", gap: 6 }}>
          {props.mode === "draft" ? (
            <button
              type="button"
              onClick={props.onCancel}
              disabled={props.isSaving}
              style={ghostButtonStyle}
            >
              Annuler
            </button>
          ) : (
            <button
              type="button"
              onClick={props.onDelete}
              disabled={props.isDeleting}
              aria-label="Supprimer"
              title="Supprimer"
              style={iconButtonDangerStyle}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            type="submit"
            disabled={!isDirty || props.isSaving}
            style={{
              ...primaryButtonStyle,
              background: isDirty ? "var(--k-primary)" : "var(--k-border)",
              cursor: isDirty ? "pointer" : "not-allowed",
            }}
          >
            {props.isSaving ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid var(--k-border)",
  borderRadius: 6,
  fontSize: 12.5,
  background: "white",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 10px",
  borderRadius: 6,
  color: "white",
  fontSize: 12,
  fontWeight: 600,
  border: "none",
  height: 28,
  lineHeight: 1,
};

const ghostButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 10px",
  borderRadius: 6,
  background: "white",
  border: "1px solid var(--k-border)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  height: 28,
  lineHeight: 1,
};

const iconButtonDangerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  border: "1px solid var(--k-border)",
  borderRadius: 6,
  background: "white",
  color: "var(--k-danger)",
  cursor: "pointer",
};
