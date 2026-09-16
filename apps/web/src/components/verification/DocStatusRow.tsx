"use client";

import { FileText, Trash2 } from "lucide-react";
import type { VerificationDoc } from "@kayu/schemas";
import { verificationCopy } from "@/copy/verification";
import { cn } from "@/lib/utils";

const copy = verificationCopy;

function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

/** An uploaded document: file name, date, decision pill (with the rejection reason) and remove. */
export function DocStatusRow({ doc, onRemove, removable }: { doc: VerificationDoc; onRemove?: () => void; removable: boolean }) {
  const decision = doc.decision;
  const pill =
    decision === "APPROVED"
      ? { label: copy.decisions.APPROVED, className: "status-pill status-pill--confirmed" }
      : decision === "REJECTED"
        ? { label: copy.decisions.REJECTED, className: "status-pill status-pill--cancelled" }
        : { label: copy.decisions.pending, className: "status-pill status-pill--pending" };

  return (
    <div className="rounded-2xl border border-border bg-white p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <FileText size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{doc.fileName}</p>
          <p className="text-[11px] text-muted-foreground">{copy.upload.uploadedOn(formatDate(doc.uploadedAt))}</p>
        </div>
        <span className={cn(pill.className, "shrink-0")}>{pill.label}</span>
        {removable && onRemove && (
          <button type="button" onClick={onRemove} aria-label={copy.upload.remove} className="icon-button size-9 text-destructive">
            <Trash2 size={16} aria-hidden />
          </button>
        )}
      </div>
      {decision === "REJECTED" && doc.rejectionReason && (
        <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          {copy.rejectionReason} : {doc.rejectionReason}
        </p>
      )}
    </div>
  );
}
