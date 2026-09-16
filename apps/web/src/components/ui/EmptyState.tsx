import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** One CTA (contract §11 rule 7): a link, or any node. */
  action?: { href: string; label: string; tone?: "primary" | "gold" } | ReactNode;
  className?: string;
};

function isLinkAction(action: EmptyStateProps["action"]): action is { href: string; label: string; tone?: "primary" | "gold" } {
  return typeof action === "object" && action !== null && "href" in action && "label" in action;
}

/** Dashed `rounded-3xl` card with an icon, a title and one CTA. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("empty-state flex flex-col items-center", className)}>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon size={26} aria-hidden strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-base font-extrabold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {isLinkAction(action) ? (
        <Link href={action.href} className={cn("primary-action mt-5 max-w-xs", action.tone === "gold" && "primary-action--gold")}>
          {action.label}
        </Link>
      ) : action ? (
        <div className="mt-5">{action}</div>
      ) : null}
    </div>
  );
}
