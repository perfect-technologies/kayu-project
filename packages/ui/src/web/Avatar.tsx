"use client";

import * as React from "react";
import { User } from "lucide-react";
import { fonts, palette } from "../tokens.js";

export type AvatarProps = {
  src?: string | null;
  name?: string | null;
  /** Overrides the initials derived from `name`. */
  initials?: string;
  size?: number;
  alt?: string;
  ring?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const deriveInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Fallback ladder: photo → initials on mint → Lucide `User` on mint. */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  initials,
  size = 48,
  alt,
  ring = false,
  className,
  style,
}) => {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const showPhoto = Boolean(src) && failedSrc !== src;
  const label = initials ?? (name ? deriveInitials(name) : "");

  return (
    <span
      role="img"
      aria-label={alt ?? name ?? undefined}
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: palette.secondary,
        color: palette.primary,
        fontFamily: `var(--font-heading, ${fonts.heading})`,
        fontWeight: 700,
        fontSize: Math.round(size * 0.36),
        boxShadow: ring ? `0 0 0 2px ${palette.card}, 0 0 0 4px ${palette.accent}` : undefined,
        ...style,
      }}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt=""
          onError={() => setFailedSrc(src ?? null)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : label ? (
        <span aria-hidden>{label}</span>
      ) : (
        <User aria-hidden size={Math.round(size * 0.5)} strokeWidth={1.75} />
      )}
    </span>
  );
};
