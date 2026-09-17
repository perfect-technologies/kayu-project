import { shellCopy } from "@/copy/shell";
import { cn } from "@/lib/utils";

export type LogoSize = 28 | 36 | 60;

const TEXT: Record<LogoSize, string> = {
  28: "text-lg",
  36: "text-xl",
  60: "text-[34px]",
};

/** The KAYOU mark: two figures, forest green and gold, ported from the K-YOU reference (public/logo.svg is the same drawing). */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <circle cx="38.5" cy="25.5" r="9.6" className="fill-primary" />
      <path
        className="fill-primary"
        d="M30 38C40 33 53 35 53 43C53 48 47 52 41.5 56C38.3 58.3 38.3 60.2 41.5 62.5C47 66.5 53 71 53 77.5C53 84 40 85 33 83C26 81 24 72.5 24 62C24 52 24 42 30 38Z"
      />
      <circle cx="62.5" cy="31.5" r="9.2" className="fill-accent" />
      <path
        className="fill-accent"
        d="M44.5 55.5C52 49 60.5 44 68 43C75 42 76.5 50 76.5 58.5C76.5 67 75 77 68 79.5C60.5 81 52 71 44.5 63.5C42.8 61.8 42.8 57.2 44.5 55.5Z"
      />
    </svg>
  );
}

export function Logo({
  size = 36,
  withText = true,
  onDark = false,
  className = "",
}: {
  size?: LogoSize;
  withText?: boolean;
  /** White wordmark for the emerald panels. */
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2", className)}>
      <LogoMark size={size} />
      {withText ? (
        <span
          className={cn(
            "font-heading leading-none font-extrabold tracking-tight whitespace-nowrap",
            TEXT[size],
            onDark ? "text-white" : "text-primary",
          )}
        >
          {shellCopy.brand}
        </span>
      ) : (
        <span className="sr-only">{shellCopy.brand}</span>
      )}
    </span>
  );
}
