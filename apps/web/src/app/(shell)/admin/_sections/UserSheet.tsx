"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys } from "@kayu/api";
import { Printer, X } from "lucide-react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { adminCopy } from "@/copy/admin";
import { apiClient } from "@/lib/api";
import { MemberSheet } from "./MemberSheet";

const copy = adminCopy.sheet;

/** Right-side sheet (full screen below `sm`) rendering the member sheet from `GET /admin/users/:id/cv`. */
export function UserSheet({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const query = useQuery({
    queryKey: queryKeys.admin.userCv(userId ?? ""),
    queryFn: () => adminApi(apiClient).userCv(userId!),
    enabled: Boolean(userId),
  });

  return (
    <Sheet open={Boolean(userId)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" aria-describedby={undefined} className="w-full gap-0 admin-canvas overflow-y-auto p-0 sm:max-w-3xl [&>button:last-child]:hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 print:hidden sm:px-6">
          <SheetTitle className="text-base font-extrabold">{copy.title}</SheetTitle>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => window.print()} disabled={!query.data} className="secondary-action h-10 px-4 text-xs">
              <Printer size={15} aria-hidden /> {copy.print}
            </button>
            <button type="button" onClick={onClose} aria-label={adminCopy.common.close} className="icon-button size-10">
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {query.isLoading && <SkeletonCard lines={6} />}
          {query.isError && <ErrorCard onRetry={() => void query.refetch()} />}
          {query.data && <MemberSheet data={query.data} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
