import { Skeleton } from "@/components/ui/skeleton";

/** Twin of `ProviderCard`: square photo, rating chip, two lines, city, gold pill. */
export function ProviderCardSkeleton() {
  return (
    <div aria-hidden className="loading-card flex flex-col">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-auto h-10 w-full rounded-full" />
      </div>
    </div>
  );
}
