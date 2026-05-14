import { Skeleton } from "@/components/ui/skeleton";

const cardShell = {
  background: "var(--k-surface)",
  border: "1px solid var(--k-border)",
  borderRadius: 14,
  padding: 18,
};

export function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div style={cardShell}>
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-4 w-56 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div style={cardShell}>
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ ...cardShell, flex: "1.4 1 280px" }}>
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div style={{ ...cardShell, flex: "1 1 240px" }}>
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div style={cardShell}>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
