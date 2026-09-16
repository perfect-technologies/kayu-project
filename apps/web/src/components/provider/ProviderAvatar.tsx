"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { getInitials } from "@kayu/utils";
import { cn } from "@/lib/utils";

export type ProviderAvatarProps = {
  src: string | null | undefined;
  name: string;
  size?: 32 | 44 | 56 | 96 | 112;
  /** Fill the parent instead of a fixed square (search tiles). */
  fill?: boolean;
  rounded?: "full" | "2xl" | "none";
  className?: string;
};

/** Fallback ladder: `profilePhoto` → initials in Sora on mint → Lucide `User` on mint. */
export function ProviderAvatar({ src, name, size = 56, fill = false, rounded = "2xl", className }: ProviderAvatarProps) {
  const [broken, setBroken] = useState(false);
  const showPhoto = Boolean(src) && !broken;
  const initials = getInitials(name);
  const radius = rounded === "full" ? "rounded-full" : rounded === "2xl" ? "rounded-2xl" : "";
  const style = fill ? undefined : { width: size, height: size, fontSize: Math.round(size * 0.34) };

  return (
    <span
      role="img"
      aria-label={name}
      style={style}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-secondary font-heading font-extrabold text-primary",
        fill && "h-full w-full",
        radius,
        className,
      )}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src!} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : initials ? (
        <span aria-hidden className={fill ? "text-3xl" : undefined}>
          {initials}
        </span>
      ) : (
        <User aria-hidden size={fill ? 40 : Math.round(size * 0.5)} strokeWidth={1.75} />
      )}
    </span>
  );
}
