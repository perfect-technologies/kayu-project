"use client";

import { Printer } from "lucide-react";
import { cguCopy } from "@/copy/legal";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="secondary-action mt-4 min-h-10 px-3.5 text-xs">
      <Printer size={14} aria-hidden /> {cguCopy.print}
    </button>
  );
}
