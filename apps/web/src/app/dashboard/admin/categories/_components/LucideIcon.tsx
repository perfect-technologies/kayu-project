"use client";

import * as React from "react";
import * as LucideAll from "lucide-react";
import type { LucideIcon } from "lucide-react";

function resolve(name: string): LucideIcon | null {
  if (!name) return null;
  const direct = (LucideAll as Record<string, unknown>)[name];
  if (isRenderable(direct)) return direct as LucideIcon;
  const aliased = (LucideAll as Record<string, unknown>)[`${name}Icon`];
  return isRenderable(aliased) ? (aliased as LucideIcon) : null;
}

function isRenderable(value: unknown): boolean {
  if (typeof value === "function") return true;
  return (
    typeof value === "object" &&
    value !== null &&
    "$$typeof" in (value as Record<string, unknown>)
  );
}

type Props = {
  name: string | null | undefined;
  size?: number;
  color?: string;
};

export function LucideIconView({ name, size = 16, color }: Props) {
  const Icon = React.useMemo(() => resolve(name ?? ""), [name]);
  if (!Icon) return null;
  return <Icon size={size} color={color} />;
}
