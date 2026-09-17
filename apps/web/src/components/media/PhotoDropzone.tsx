"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, Plus, RefreshCw, X } from "lucide-react";
import { MEDIA_LIMITS } from "@kayu/schemas";
import { onboardingCopy } from "@/copy/onboarding";
import { uploadFile } from "@/lib/media-upload";
import { cn } from "@/lib/utils";
import { newMediaKey, type MediaDraftItem } from "./media-draft";
import { UploadProgress } from "./UploadProgress";

const copy = onboardingCopy.photo;
const ACCEPT = MEDIA_LIMITS.imageMimes.join(",");

type Pending = { key: string; file: File; previewUrl: string; progress: number; error: string | null };

type SingleProps = {
  multiple?: false;
  value: MediaDraftItem | null;
  onChange: (value: MediaDraftItem | null) => void;
};

type MultipleProps = {
  multiple: true;
  value: MediaDraftItem[];
  onChange: (value: MediaDraftItem[]) => void;
  max?: number;
};

export type PhotoDropzoneProps = (SingleProps | MultipleProps) & {
  label: string;
  hint?: string;
  onBusyChange?: (busy: boolean) => void;
  className?: string;
};

function validate(file: File): string | null {
  if (!(MEDIA_LIMITS.imageMimes as readonly string[]).includes(file.type)) return copy.badType;
  if (file.size > MEDIA_LIMITS.maxImageBytes) return copy.tooLarge;
  return null;
}

/**
 * Dashed dropzone uploading to the `media` purpose as soon as a file is picked (with progress);
 * single mode shows a circular preview, multiple mode a tile grid (≤ 12 images).
 */
export function PhotoDropzone(props: PhotoDropzoneProps) {
  const { label, hint, onBusyChange, className } = props;
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const max = props.multiple ? (props.max ?? MEDIA_LIMITS.maxImages) : 1;
  const items = props.multiple ? props.value : props.value ? [props.value] : [];
  const busy = pending.some((item) => item.error === null);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useEffect(() => () => pending.forEach((item) => URL.revokeObjectURL(item.previewUrl)), [pending]);

  const patchPending = (key: string, patch: Partial<Pending>) =>
    setPending((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const start = async (entry: Pending) => {
    try {
      const uploaded = await uploadFile("media", entry.file, { onProgress: (progress) => patchPending(entry.key, { progress }) });
      const item: MediaDraftItem = { key: entry.key, kind: "IMAGE", path: uploaded.path, url: uploaded.url ?? entry.previewUrl };
      setPending((current) => current.filter((candidate) => candidate.key !== entry.key));
      if (props.multiple) props.onChange([...props.value, item]);
      else props.onChange(item);
    } catch {
      patchPending(entry.key, { error: copy.uploadFailed });
    }
  };

  const pick = (files: FileList | File[]) => {
    setMessage(null);
    const list = Array.from(files);
    if (list.length === 0) return;
    const room = max - items.length - pending.filter((item) => item.error === null).length;
    if (room <= 0) {
      setMessage(copy.tooMany(max));
      return;
    }
    const accepted: Pending[] = [];
    for (const file of list.slice(0, room)) {
      const problem = validate(file);
      if (problem) {
        setMessage(problem);
        continue;
      }
      accepted.push({ key: newMediaKey(), file, previewUrl: URL.createObjectURL(file), progress: 0, error: null });
    }
    if (list.length > room) setMessage(copy.tooMany(max));
    if (accepted.length === 0) return;
    if (!props.multiple) {
      props.onChange(null);
      setPending((current) => current.filter((item) => item.error !== null));
    }
    setPending((current) => [...current, ...accepted]);
    accepted.forEach((entry) => void start(entry));
  };

  const retry = (entry: Pending) => {
    patchPending(entry.key, { error: null, progress: 0 });
    void start({ ...entry, error: null, progress: 0 });
  };

  const removePending = (key: string) => setPending((current) => current.filter((item) => item.key !== key));

  const remove = (key: string) => {
    if (props.multiple) props.onChange(props.value.filter((item) => item.key !== key));
    else props.onChange(null);
  };

  const dropHandlers = {
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      pick(event.dataTransfer.files);
    },
  };

  const fileInput = (
    <input
      ref={input}
      id={id}
      type="file"
      accept={ACCEPT}
      multiple={props.multiple === true}
      className="sr-only"
      onChange={(event) => {
        if (event.target.files) pick(event.target.files);
        event.target.value = "";
      }}
    />
  );

  if (!props.multiple) {
    const current = items[0] ?? null;
    const uploading = pending[0] ?? null;
    return (
      <div className={cn("min-w-0", className)}>
        <p className="mb-1.5 text-xs font-bold">{label}</p>
        <div
          {...dropHandlers}
          className={cn("rounded-2xl border-2 border-dashed bg-secondary/30 p-5 text-center transition", dragging ? "border-primary bg-primary/5" : "border-border")}
        >
          {uploading ? (
            <div className="mx-auto max-w-[220px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uploading.previewUrl} alt={copy.alt} className="mx-auto size-20 rounded-full object-cover ring-2 ring-primary/20" />
              {uploading.error ? (
                <div className="mt-3 space-y-2">
                  <p role="alert" className="text-xs font-semibold text-destructive">
                    {uploading.error}
                  </p>
                  <div className="flex justify-center gap-2">
                    <button type="button" onClick={() => retry(uploading)} className="secondary-action min-h-9 px-3 text-xs">
                      <RefreshCw size={14} aria-hidden /> {copy.retry}
                    </button>
                    <button type="button" onClick={() => removePending(uploading.key)} className="secondary-action min-h-9 px-3 text-xs">
                      {copy.remove}
                    </button>
                  </div>
                </div>
              ) : (
                <UploadProgress percent={uploading.progress} label={copy.uploading(uploading.progress)} className="mt-3" />
              )}
            </div>
          ) : current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={copy.alt} className="mx-auto size-20 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <Camera aria-hidden size={28} className="mx-auto text-muted-foreground/60" />
          )}
          <label htmlFor={id} className="mt-2 block cursor-pointer text-xs font-bold text-primary">
            {current ? copy.replace : copy.add}
          </label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint ?? copy.hint}</p>
          {fileInput}
          {current && !uploading && (
            <button type="button" onClick={() => remove(current.key)} className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-muted-foreground">
              <X size={12} aria-hidden /> {copy.remove}
            </button>
          )}
        </div>
        {message && (
          <p role="alert" className="mt-1 text-xs font-semibold text-destructive">
            {message}
          </p>
        )}
      </div>
    );
  }

  const canAdd = items.length + pending.length < max;
  return (
    <div className={cn("min-w-0", className)}>
      <p className="mb-1.5 text-xs font-bold">{label}</p>
      <div {...dropHandlers} className={cn("rounded-2xl border-2 border-dashed bg-secondary/30 p-3 transition", dragging ? "border-primary bg-primary/5" : "border-border")}>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item) => (
            <li key={item.key} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={copy.alt} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => remove(item.key)}
                aria-label={copy.remove}
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
          {pending.map((entry) => (
            <li key={entry.key} className="relative flex aspect-square flex-col justify-end overflow-hidden rounded-xl bg-muted p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.previewUrl} alt={copy.alt} className={cn("absolute inset-0 size-full object-cover", entry.error && "opacity-40")} />
              {entry.error ? (
                <div className="relative flex flex-col items-center gap-1">
                  <span role="alert" className="sr-only">
                    {entry.error}
                  </span>
                  <button type="button" onClick={() => retry(entry)} className="flex min-h-8 items-center gap-1 rounded-full bg-white px-2 text-[11px] font-bold text-primary shadow-soft">
                    <RefreshCw size={12} aria-hidden /> {copy.retry}
                  </button>
                  <button type="button" onClick={() => removePending(entry.key)} aria-label={copy.remove} className="absolute -top-8 right-0 flex size-7 items-center justify-center rounded-full bg-black/60 text-white">
                    <X size={14} aria-hidden />
                  </button>
                </div>
              ) : (
                <div className="relative rounded-md bg-white/85 px-1.5 py-1">
                  <UploadProgress percent={entry.progress} label={copy.uploading(entry.progress)} />
                </div>
              )}
            </li>
          ))}
          {canAdd && (
            <li>
              <label htmlFor={id} className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-white text-xs font-bold text-primary">
                <Plus size={18} aria-hidden />
                {copy.addMany}
              </label>
            </li>
          )}
        </ul>
        {fileInput}
        <p className="mt-2 text-[11px] text-muted-foreground">{hint ?? copy.hint}</p>
      </div>
      {message && (
        <p role="alert" className="mt-1 text-xs font-semibold text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
