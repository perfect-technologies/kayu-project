"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { AdminRail, type AdminSection } from "@/components/layout/AdminRail";
import { RoutePlaceholder } from "@/components/placeholder/RoutePlaceholder";
import { shellCopy } from "@/copy/shell";

/** Workstream 08 replaces this list with the 13 K-YOU sections plus the KYC queue (copy/admin.ts). */
const sections: AdminSection[] = [
  { key: "overview", label: shellCopy.screenTitles.admin, icon: LayoutDashboard },
  { key: "verification", label: shellCopy.screenTitles.verification, icon: ShieldCheck },
];

function AdminShell() {
  const tab = useSearchParams().get("tab") ?? sections[0].key;
  return (
    <div className="admin-canvas">
      <div className="mx-auto max-w-[1500px] lg:flex">
        <AdminRail sections={sections} active={tab} />
        <div className="min-w-0 flex-1">
          <RoutePlaceholder title={shellCopy.screenTitles.admin} workstream="08" container="max-w-none" />
        </div>
      </div>
    </div>
  );
}

export function AdminPlaceholder() {
  return (
    <Suspense fallback={null}>
      <AdminShell />
    </Suspense>
  );
}
