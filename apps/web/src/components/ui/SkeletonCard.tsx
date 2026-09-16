import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/** Card-shaped placeholder: avatar, two lines and a pill row. */
export function SkeletonCard({ className, lines = 2 }: { className?: string; lines?: number }) {
  return (
    <div aria-hidden className={cn("rounded-3xl border border-border bg-white p-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("space-y-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
