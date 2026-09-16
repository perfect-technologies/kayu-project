"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { spacesCopy } from "@/copy/spaces";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  /** A route to go back to, or `"history"` to pop the browser history (falls back to `/`). */
  back?: string | "history";
  backLabel?: string;
  /** Right-side primary icon circle. */
  icon?: ReactNode;
  iconHref?: string;
  iconLabel?: string;
  iconDot?: boolean;
  onIconClick?: () => void;
  /** Free right-side slot; used instead of `icon`. */
  action?: ReactNode;
  centered?: boolean;
  className?: string;
};

/** Back circle, H1 (+ subtitle) and an optional right-side circle or action; used by every signed-in screen. */
export function PageHeader({
  title,
  subtitle,
  back,
  backLabel = spacesCopy.back,
  icon,
  iconHref,
  iconLabel,
  iconDot,
  onIconClick,
  action,
  centered,
  className,
}: PageHeaderProps) {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };

  const circle = "relative flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground";
  const dot = iconDot && <span aria-hidden className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-accent ring-2 ring-primary" />;

  return (
    <header className={cn("flex items-center gap-3", className)}>
      {back === "history" ? (
        <button type="button" onClick={goBack} className="icon-button" aria-label={backLabel}>
          <ArrowLeft size={18} aria-hidden />
        </button>
      ) : back ? (
        <Link href={back} className="icon-button" aria-label={backLabel}>
          <ArrowLeft size={18} aria-hidden />
        </Link>
      ) : null}
      <div className={cn("min-w-0 flex-1", centered && "text-center")}>
        <h1>{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action ??
        (icon &&
          (iconHref ? (
            <Link href={iconHref} className={circle} aria-label={iconLabel}>
              {icon}
              {dot}
            </Link>
          ) : onIconClick ? (
            <button type="button" onClick={onIconClick} className={circle} aria-label={iconLabel}>
              {icon}
              {dot}
            </button>
          ) : (
            <span className={circle} aria-hidden>
              {icon}
              {dot}
            </span>
          )))}
    </header>
  );
}
