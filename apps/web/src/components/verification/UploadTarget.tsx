"use client";

import { useId, useState } from "react";
import { RefreshCw, UploadCloud } from "lucide-react";
import { MEDIA_LIMITS, type VerificationDoc, type VerificationDocKind } from "@kayu/schemas";
import { UploadProgress } from "@/components/media/UploadProgress";
import { verificationCopy } from "@/copy/verification";
import { uploadFile } from "@/lib/media-upload";
import { cn } from "@/lib/utils";
import { DocStatusRow } from "./DocStatusRow";

const copy = verificationCopy;
const ACCEPT = [...MEDIA_LIMITS.imageMimes, ...MEDIA_LIMITS.documentMimes].join(",");

export type UploadTargetProps = {
  kind: VerificationDocKind;
  required: boolean;
  doc: VerificationDoc | null;
  /** Uploads are locked while the submission is under review or verified. */
  locked: boolean;
  onUploaded: (input: { kind: VerificationDocKind; path: string; fileName: string; mime: string; bytes: number }) => Promise<void>;
  onRemove: (docId: string) => Promise<void>;
};

function validate(file: File): string | null {
  const mimes: readonly string[] = [...MEDIA_LIMITS.imageMimes, ...MEDIA_LIMITS.documentMimes];
  if (!mimes.includes(file.type)) return copy.upload.badType;
  if (file.size > MEDIA_LIMITS.maxDocumentBytes) return copy.upload.tooLarge;
  return null;
}

/** Dashed dropzone for one document kind; becomes a `DocStatusRow` once a file is registered. */
export function UploadTarget({ kind, required, doc, locked, onUploaded, onRemove }: UploadTargetProps) {
  const id = useId();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const info = copy.kinds[kind];
  const busy = progress !== null;

  const send = async (file: File) => {
    const problem = validate(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setLastFile(file);
    setProgress(0);
    try {
      const uploaded = await uploadFile("verification", file, { onProgress: setProgress });
      await onUploaded({ kind, path: uploaded.path, fileName: file.name, mime: file.type, bytes: file.size });
      setLastFile(null);
    } catch {
      setError(copy.upload.failed);
    } finally {
      setProgress(null);
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">{info.title}</h3>
        <span className={cn("text-[11px] font-semibold", required ? "text-primary" : "text-muted-foreground")}>{required ? copy.required : copy.optional}</span>
      </div>
      <p className="text-xs text-muted-foreground">{info.hint}</p>
      {doc ? (
        <DocStatusRow doc={doc} removable={!locked && doc.decision !== "APPROVED"} onRemove={() => void onRemove(doc.id)} />
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!locked) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file && !locked && !busy) void send(file);
          }}
          className={cn("rounded-2xl border-2 border-dashed bg-secondary/30 p-4 text-center transition", dragging ? "border-primary bg-primary/5" : "border-border", locked && "opacity-60")}
        >
          {busy && progress !== null ? (
            <UploadProgress percent={progress} label={copy.upload.uploading(progress)} className="mx-auto max-w-xs" />
          ) : (
            <>
              <UploadCloud size={24} aria-hidden className="mx-auto text-muted-foreground/70" />
              <label htmlFor={id} className={cn("mt-1 block text-xs font-bold text-primary", locked ? "cursor-not-allowed" : "cursor-pointer")}>
                {copy.upload.add}
              </label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{copy.upload.hint}</p>
              <input
                id={id}
                type="file"
                accept={ACCEPT}
                disabled={locked || busy}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void send(file);
                  event.target.value = "";
                }}
              />
            </>
          )}
        </div>
      )}
      {error && (
        <div className="flex flex-wrap items-center gap-2">
          <p role="alert" className="text-xs font-semibold text-destructive">
            {error}
          </p>
          {lastFile && (
            <button type="button" onClick={() => void send(lastFile)} className="secondary-action min-h-9 px-3 text-xs">
              <RefreshCw size={14} aria-hidden /> {copy.retry}
            </button>
          )}
        </div>
      )}
      {doc && !locked && doc.decision !== "APPROVED" && (
        <label htmlFor={`${id}-replace`} className="inline-flex min-h-9 cursor-pointer items-center text-xs font-bold text-primary">
          {copy.upload.replace}
          <input
            id={`${id}-replace`}
            type="file"
            accept={ACCEPT}
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void send(file);
              event.target.value = "";
            }}
          />
        </label>
      )}
    </section>
  );
}
