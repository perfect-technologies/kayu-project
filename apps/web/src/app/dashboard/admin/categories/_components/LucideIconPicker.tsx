"use client";

import * as React from "react";
import * as LucideAll from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

const HELPERS = new Set([
  "createLucideIcon",
  "Icon",
  "LucideIcon",
  "icons",
  "default",
  "iconNode",
]);

function isRenderableIcon(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (
    typeof value === "object" &&
    value !== null &&
    "$$typeof" in (value as Record<string, unknown>)
  ) {
    return true;
  }
  return false;
}

// lucide-react ships every icon twice: a canonical name (e.g. "Wrench") and
// an "Icon"-suffixed alias (e.g. "WrenchIcon"). Skip the suffixed aliases —
// but only when the canonical version is also exported, so we don't drop
// any legitimate icons that only exist under an "Icon" name.
const ALL_ICONS: Array<{ name: string; Icon: LucideIcon }> = (() => {
  const entries = Object.entries(LucideAll as Record<string, unknown>);
  const lookup = new Map(entries);
  return entries
    .filter(([name, value]) => {
      if (HELPERS.has(name)) return false;
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) return false;
      if (!isRenderableIcon(value)) return false;
      if (name.endsWith("Icon") && lookup.has(name.slice(0, -4))) return false;
      return true;
    })
    .map(([name, Icon]) => ({ name, Icon: Icon as LucideIcon }))
    .sort((a, b) => a.name.localeCompare(b.name));
})();

const MAX_RESULTS = 80;

export function LucideIconPicker({ value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = q
      ? ALL_ICONS.filter((entry) => entry.name.toLowerCase().includes(q))
      : ALL_ICONS;
    return source.slice(0, MAX_RESULTS);
  }, [query]);

  const SelectedIcon = React.useMemo(() => {
    if (!value) return null;
    const direct = ALL_ICONS.find((entry) => entry.name === value);
    if (direct) return direct.Icon;
    // Fall back to looking up the "Icon"-suffixed alias for legacy values.
    const aliased = (LucideAll as Record<string, unknown>)[`${value}Icon`];
    return isRenderableIcon(aliased) ? (aliased as LucideIcon) : null;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "8px 10px",
            border: "1px solid var(--k-border)",
            borderRadius: 8,
            background: "white",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--k-text-body)" }}>
            {SelectedIcon ? (
              <SelectedIcon size={16} />
            ) : (
              <span style={{ color: "var(--k-text-subtle)" }}>—</span>
            )}
            <span style={{ fontFamily: "var(--k-font-mono)", fontSize: 12.5 }}>
              {value || "Choisir une icône"}
            </span>
          </span>
          <ChevronDown size={14} style={{ color: "var(--k-text-muted)" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent style={{ width: 320, padding: 0 }} align="start">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 10px",
            borderBottom: "1px solid var(--k-border)",
          }}
        >
          <Search size={14} style={{ color: "var(--k-text-muted)" }} />
          <input
            type="text"
            placeholder="Rechercher une icône…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
            }}
          />
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              style={{
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Effacer
            </button>
          ) : null}
        </div>
        <div style={{ padding: 8, maxHeight: 280, overflowY: "auto" }}>
          {matches.length === 0 ? (
            <div
              style={{
                padding: 16,
                textAlign: "center",
                fontSize: 12.5,
                color: "var(--k-text-muted)",
              }}
            >
              Aucune icône trouvée.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 4,
              }}
            >
              {matches.map(({ name, Icon }) => {
                const isSelected = name === value;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      aspectRatio: "1",
                      border: isSelected
                        ? "1px solid var(--k-primary)"
                        : "1px solid transparent",
                      borderRadius: 6,
                      background: isSelected
                        ? "var(--k-primary-subtle, #EEF2FF)"
                        : "transparent",
                      color: isSelected ? "var(--k-primary)" : "var(--k-text-body)",
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          )}
          {!query && matches.length === MAX_RESULTS ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 11.5,
                color: "var(--k-text-subtle)",
                textAlign: "center",
              }}
            >
              Affinez la recherche pour voir d&apos;autres icônes.
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
