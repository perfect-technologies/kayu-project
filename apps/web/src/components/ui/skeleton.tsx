import { cn } from "@/lib/utils";

/** Skeleton primitives (contract §10: skeletons, never spinners, on content). */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={cn("skeleton-sheen block rounded-[14px]", className)} style={style} />;
}

export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-3", index === lines - 1 ? "w-1/2" : "w-full")} />
      ))}
    </div>
  );
}

/** The search result placeholder: photo block, two lines and a pill. */
export function LoadingCard({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("loading-card", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-4 h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function LoadingRow({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3 rounded-3xl border border-border bg-white p-4", className)}>
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
