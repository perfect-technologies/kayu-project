"use client";

import { Wrench } from "lucide-react";
import { useSiteSettings, settingOr } from "@/hooks/useSiteSettings";
import { shellCopy } from "@/copy/shell";

export function MaintenanceBanner() {
  const { settings } = useSiteSettings();
  if (!settings.maintenance_mode) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-950"
    >
      <Wrench size={14} aria-hidden />
      {settingOr(settings.maintenance_message, shellCopy.maintenance.fallback)}
    </div>
  );
}
