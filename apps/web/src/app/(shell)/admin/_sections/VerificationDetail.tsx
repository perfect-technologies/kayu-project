"use client";

import { adminApi } from "@kayu/api";
import type { AdminVerificationSubmission, VerificationDoc, VerificationDocKind } from "@kayu/schemas";
import { Check, ExternalLink, FileText, X } from "lucide-react";
import { useSignedAttachment } from "@/components/messaging/useSignedAttachment";
import { adminCopy } from "@/copy/admin";
import { verificationCopy } from "@/copy/verification";
import { apiClient } from "@/lib/api";
import { AdminStatusPill } from "../_components/AdminStatusPill";
import { ConfirmAction } from "../_components/ConfirmAction";
import { formatDate } from "../_components/format";
import { useAdminMutation } from "../_components/useAdminMutation";

const copy = adminCopy.verification;
const KINDS: VerificationDocKind[] = ["ID_FRONT", "ID_BACK", "SELFIE", "ADDRESS", "CERT_OPTIONAL"];

function DocPreview({ doc }: { doc: VerificationDoc }) {
  const signed = useSignedAttachment(doc.storagePath);
  const isImage = doc.mime.startsWith("image/");
  if (signed.isError) return <span className="text-[11px] text-muted-foreground">{copy.previewUnavailable}</span>;
  if (!signed.data) return <span aria-hidden className="block size-20 rounded-xl skeleton-sheen" />;
  return (
    <a href={signed.data.url} target="_blank" rel="noreferrer" aria-label={copy.open} className="block">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signed.data.url} alt={copy.preview} className="size-20 rounded-xl border border-border object-cover" />
      ) : (
        <span className="flex size-20 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
          <FileText size={26} aria-hidden />
        </span>
      )}
    </a>
  );
}

function DocRow({ doc, busy, onReview }: { doc: VerificationDoc; busy: boolean; onReview: (dto: { docId: string; decision: "APPROVED" | "REJECTED"; rejectionReason?: string }) => Promise<unknown> }) {
  const kind = verificationCopy.kinds[doc.kind];
  const signed = useSignedAttachment(doc.storagePath);
  return (
    <li className="rounded-2xl border border-border bg-white p-3">
      <div className="flex gap-3">
        <DocPreview doc={doc} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{kind.title}</p>
          <p className="truncate text-xs text-muted-foreground">{doc.fileName}</p>
          <p className="text-[11px] text-muted-foreground">
            {copy.fileMeta(doc.mime, Math.max(1, Math.round(doc.bytes / 1024)))} · {formatDate(doc.uploadedAt)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {doc.decision ? <AdminStatusPill status={doc.decision} className="h-6" /> : <span className="status-pill status-pill--pending h-6">{copy.pending}</span>}
            {signed.data && (
              <a href={signed.data.url} target="_blank" rel="noreferrer" className="inline-flex min-h-6 items-center gap-1 text-[11px] font-bold text-primary">
                <ExternalLink size={11} aria-hidden /> {copy.open}
              </a>
            )}
          </div>
        </div>
      </div>
      {doc.decision === "REJECTED" && doc.rejectionReason && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{doc.rejectionReason}</p>}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" disabled={busy || doc.decision === "APPROVED"} onClick={() => void onReview({ docId: doc.id, decision: "APPROVED" })} className="secondary-action h-9 px-3 text-xs text-emerald-700">
          <Check size={14} aria-hidden /> {copy.approve}
        </button>
        <ConfirmAction
          className="h-9 px-3 text-xs"
          destructive
          disabled={busy || doc.decision === "REJECTED"}
          sheet={{ title: copy.sheets.reject.title, description: copy.sheets.reject.description, confirmLabel: copy.sheets.reject.confirm, reason: { label: copy.sheets.reject.reason, placeholder: copy.sheets.reject.placeholder, required: true } }}
          onConfirm={(reason) => onReview({ docId: doc.id, decision: "REJECTED", rejectionReason: reason })}
        >
          <X size={14} aria-hidden /> {copy.reject}
        </ConfirmAction>
      </div>
    </li>
  );
}

/** One submission: aggregate pill, then a row per document with thumbnail, meta and approve / reject. */
export function VerificationDetail({ submission }: { submission: AdminVerificationSubmission }) {
  const review = useAdminMutation({
    mutationFn: (dto: { docId: string; decision: "APPROVED" | "REJECTED"; rejectionReason?: string }) =>
      adminApi(apiClient).reviewVerificationDoc({ providerId: submission.providerId, ...dto }),
    invalidate: [["admin", "verification"], ["admin", "providers"]],
    success: (result) => (result.reviewedDoc.decision === "APPROVED" ? copy.toasts.approved : copy.toasts.rejected),
  });
  const docs = [...submission.docs].sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));

  return (
    <div className="rounded-3xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-foreground">{submission.displayName}</h3>
          <p className="text-xs text-muted-foreground">
            {submission.providerName}
            {submission.providerEmail ? ` · ${submission.providerEmail}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {submission.submittedAt ? copy.submittedOn(formatDate(submission.submittedAt)) : copy.notSubmitted} · {copy.progress(submission.counts.approved, submission.counts.total)}
          </p>
        </div>
        <AdminStatusPill status={submission.verificationStatus} />
      </div>
      {submission.rejectionReason && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{submission.rejectionReason}</p>}
      <h4 className="mt-5 mb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{copy.documents}</h4>
      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.notSubmitted}</p>
      ) : (
        <ul className="space-y-3">
          {docs.map((doc) => (
            <DocRow key={doc.id} doc={doc} busy={review.isPending} onReview={(dto) => review.mutateAsync(dto)} />
          ))}
        </ul>
      )}
    </div>
  );
}
