import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { adminCopy } from "@/copy/admin";

export type QueryStateProps = {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  empty: { icon: LucideIcon; title: string; description?: string; action?: ReactNode };
  skeletons?: number;
  children: ReactNode;
};

/** Loading skeletons, the retry card, the dashed empty state, or the content. */
export function QueryState({ isLoading, isError, onRetry, isEmpty, empty, skeletons = 3, children }: QueryStateProps) {
  if (isLoading) return <SkeletonList count={skeletons} />;
  if (isError) return <ErrorCard message={adminCopy.common.loadError} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState icon={empty.icon} title={empty.title} description={empty.description} action={empty.action} />;
  return <>{children}</>;
}
