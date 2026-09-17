"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { getInitials } from "@kayu/utils";
import { cn } from "@/lib/utils";

export type MiniAvatarProps = {
  src: string | null | undefined;
  name: string;
  size?: 40 | 44 | 48 | 56 | 64 | 96;
  className?: string;
};

/** Round photo, or initials on the primary colour; the small avatar of the signed-in spaces. */
export function MiniAvatar({ src, name, size = 44, className }: MiniAvatarProps) {
  const [broken, setBroken] = useState(false);
  const initials = getInitials(name);
  return (
    <span
      role="img"
      aria-label={name}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-heading font-extrabold text-primary-foreground",
        className,
      )}
    >
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : initials ? (
        <span aria-hidden>{initials}</span>
      ) : (
        <User aria-hidden size={Math.round(size * 0.5)} strokeWidth={1.75} />
      )}
    </span>
  );
}
