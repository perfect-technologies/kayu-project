import { cn } from "@/lib/utils";

export type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** Optional right-side slot (desktop link, action). */
  action?: React.ReactNode;
  className?: string;
};

/** Eyebrow pill + H2 + optional subtitle. Server-safe. */
export function SectionHeading({ eyebrow, title, subtitle, align = "left", action, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", align === "center" && "justify-center", className)}>
      <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}>
        {eyebrow && (
          <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-[10px] font-extrabold tracking-[.19em] text-accent-foreground uppercase">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="hidden shrink-0 sm:block">{action}</div>}
    </div>
  );
}
