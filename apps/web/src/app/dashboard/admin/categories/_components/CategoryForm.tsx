"use client";

import * as React from "react";
import { LucideIconPicker } from "./LucideIconPicker";
import { slugify } from "./slug";

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: string;
  color: string;
  order: number;
  isActive: boolean;
};

export type CategoryFormProps = {
  initialValues: CategoryFormValues;
  isSaving: boolean;
  isDeleting: boolean;
  saveError: string | null;
  onSave: (values: CategoryFormValues) => void;
  onDelete: () => void;
};

export function CategoryForm({
  initialValues,
  isSaving,
  isDeleting,
  saveError,
  onSave,
  onDelete,
}: CategoryFormProps) {
  const [values, setValues] = React.useState<CategoryFormValues>(initialValues);
  const [slugTouched, setSlugTouched] = React.useState(false);

  React.useEffect(() => {
    setValues(initialValues);
    setSlugTouched(false);
  }, [initialValues]);

  const isDirty = React.useMemo(() => {
    return (Object.keys(values) as Array<keyof CategoryFormValues>).some(
      (key) => values[key] !== initialValues[key],
    );
  }, [values, initialValues]);

  function update<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
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
        onSave(values);
      }}
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--k-text-primary)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Détails de la catégorie
      </h3>

      <Field label="Nom *">
        <input
          type="text"
          value={values.name}
          onChange={(event) => handleNameChange(event.target.value)}
          required
          style={inputStyle}
        />
      </Field>

      <Field label="Slug *">
        <input
          type="text"
          value={values.slug}
          onChange={(event) => {
            setSlugTouched(true);
            update("slug", event.target.value);
          }}
          required
          style={{ ...inputStyle, fontFamily: "var(--k-font-mono)" }}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      <Field label="Icône">
        <LucideIconPicker
          value={values.icon}
          onChange={(next) => update("icon", next)}
        />
      </Field>

      <Field label="Image (URL)">
        <input
          type="text"
          value={values.image}
          onChange={(event) => update("image", event.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="Couleur">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="color"
            value={isValidHex(values.color) ? values.color : "#000000"}
            onChange={(event) => update("color", event.target.value)}
            style={{
              width: 40,
              height: 36,
              padding: 2,
              border: "1px solid var(--k-border)",
              borderRadius: 8,
              background: "white",
              cursor: "pointer",
            }}
          />
          <input
            type="text"
            value={values.color}
            onChange={(event) => update("color", event.target.value)}
            placeholder="#1E40AF"
            style={{ ...inputStyle, flex: 1, fontFamily: "var(--k-font-mono)" }}
          />
        </div>
      </Field>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) => update("isActive", event.target.checked)}
        />
        Active
      </label>

      {saveError ? (
        <div style={{ fontSize: 12.5, color: "var(--k-danger)" }}>{saveError}</div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: isDirty ? "var(--k-primary)" : "var(--k-border)",
            color: "white",
            fontWeight: 600,
            fontSize: 13,
            border: "none",
            cursor: isDirty ? "pointer" : "not-allowed",
          }}
        >
          {isSaving ? "Enregistrement…" : "Enregistrer la catégorie"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "white",
            color: "var(--k-danger)",
            border: "1px solid var(--k-danger)",
            fontWeight: 600,
            fontSize: 13,
            cursor: isDeleting ? "wait" : "pointer",
          }}
        >
          {isDeleting ? "Suppression…" : "Supprimer la catégorie"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--k-text-body)" }}>
        {label}
      </span>
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--k-border)",
  borderRadius: 8,
  fontSize: 13,
  background: "white",
};

function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
