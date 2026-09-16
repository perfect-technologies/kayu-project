"use client";

import { useEffect, useId, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, RefreshCw, Trash2, Youtube } from "lucide-react";
import { MEDIA_LIMITS } from "@kayu/schemas";
import { parseYouTubeUrl } from "@kayu/utils";
import { onboardingCopy } from "@/copy/onboarding";
import { uploadFile } from "@/lib/media-upload";
import { cn } from "@/lib/utils";
import { newMediaKey, type MediaDraftItem } from "./media-draft";
import { UploadProgress } from "./UploadProgress";

const copy = onboardingCopy.video;
const MAX = MEDIA_LIMITS.maxVideos;
const ACCEPT = MEDIA_LIMITS.videoMimes.join(",");

type Pending = { key: string; file: File; progress: number; error: string | null };

export type VideoEditorProps = {
  /** Video items only (`VIDEO_YOUTUBE`, `VIDEO_UPLOAD`). */
  value: MediaDraftItem[];
  onChange: (next: MediaDraftItem[]) => void;
  onBusyChange?: (busy: boolean) => void;
  className?: string;
};

function validate(file: File): string | null {
  if (!(MEDIA_LIMITS.videoMimes as readonly string[]).includes(file.type)) return copy.badType;
  if (file.size > MEDIA_LIMITS.maxVideoBytes) return copy.tooLarge;
  return null;
}

function Thumbnail({ item }: { item: MediaDraftItem }) {
  if (item.kind === "VIDEO_YOUTUBE" && item.youtubeId) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`} alt={copy.thumbnailAlt} loading="lazy" className="aspect-video w-full object-cover" />;
  }
  return <video src={item.url} preload="metadata" muted playsInline className="aspect-video w-full bg-black object-cover" />;
}

function SortableTile({ item, onRemove }: { item: MediaDraftItem; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("relative overflow-hidden rounded-2xl border border-border bg-white", isDragging && "z-10 shadow-soft-lg")}>
      <Thumbnail item={item} />
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <button ref={setActivatorNodeRef} type="button" aria-label={copy.dragHandle} {...attributes} {...listeners} className="icon-button size-9 cursor-grab touch-none text-muted-foreground active:cursor-grabbing">
          <GripVertical size={16} aria-hidden />
        </button>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
          {item.kind === "VIDEO_YOUTUBE" && <Youtube size={14} aria-hidden />}
          {item.kind === "VIDEO_YOUTUBE" ? "YouTube" : "MP4"}
        </span>
        <button type="button" onClick={onRemove} aria-label={copy.remove} className="icon-button size-9 text-destructive">
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
    </li>
  );
}

/**
 * "Mes vidéos": YouTube link first (host check from `@kayu/utils`), then MP4/MOV/WebM uploads with
 * XHR progress. At most 12 tiles; drag (or arrow keys on the handle) to reorder; remove with confirm.
 */
export function VideoEditor({ value, onChange, onBusyChange, className }: VideoEditorProps) {
  const id = useId();
  const [mode, setMode] = useState<"youtube" | "upload">("youtube");
  const [link, setLink] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const parsed = parseYouTubeUrl(link);
  const busy = pending.some((item) => item.error === null);
  const full = value.length + pending.length >= MAX;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const add = (item: MediaDraftItem) => {
    if (value.length >= MAX) {
      setMessage(copy.tooMany(MAX));
      return false;
    }
    if (value.some((existing) => existing.url === item.url || (item.youtubeId && existing.youtubeId === item.youtubeId))) {
      setMessage(copy.duplicate);
      return false;
    }
    onChange([...value, item]);
    setMessage(null);
    return true;
  };

  const addYoutube = () => {
    if (!parsed) return;
    if (add({ key: newMediaKey(), kind: "VIDEO_YOUTUBE", url: parsed.watchUrl, youtubeId: parsed.id })) setLink("");
  };

  const patchPending = (key: string, patch: Partial<Pending>) => setPending((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const start = async (entry: Pending) => {
    try {
      const uploaded = await uploadFile("media", entry.file, { onProgress: (progress) => patchPending(entry.key, { progress }) });
      setPending((current) => current.filter((item) => item.key !== entry.key));
      onChange([...value, { key: entry.key, kind: "VIDEO_UPLOAD", path: uploaded.path, url: uploaded.url ?? "" }]);
    } catch {
      patchPending(entry.key, { error: copy.uploadFailed });
    }
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    if (full) {
      setMessage(copy.tooMany(MAX));
      return;
    }
    const problem = validate(file);
    if (problem) {
      setMessage(problem);
      return;
    }
    const entry: Pending = { key: newMediaKey(), file, progress: 0, error: null };
    setPending((current) => [...current, entry]);
    void start(entry);
  };

  const retry = (entry: Pending) => {
    patchPending(entry.key, { error: null, progress: 0 });
    void start({ ...entry, error: null, progress: 0 });
  };

  const remove = (key: string) => {
    if (!window.confirm(copy.removeConfirm)) return;
    onChange(value.filter((item) => item.key !== key));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = value.findIndex((item) => item.key === active.id);
    const to = value.findIndex((item) => item.key === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(value, from, to));
  };

  return (
    <section className={cn("space-y-3 rounded-3xl border border-border bg-white p-4", className)}>
      <h3 className="text-base font-extrabold">
        {copy.title} <span className="text-xs font-semibold text-muted-foreground">{copy.count(value.length, MAX)}</span>
      </h3>
      <div className="flex gap-2" role="tablist">
        {(
          [
            ["youtube", copy.youtubeTab],
            ["upload", copy.uploadTab],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={cn("min-h-11 flex-1 rounded-full px-3 text-sm font-semibold transition", mode === key ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground")}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "youtube" ? (
        <div className="space-y-3">
          <label htmlFor={`${id}-url`} className="block text-xs font-bold">
            {copy.urlLabel}
          </label>
          <div className="field field--icon">
            <Youtube size={18} aria-hidden />
            <input id={`${id}-url`} type="url" inputMode="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder={copy.urlPlaceholder} />
          </div>
          {parsed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={parsed.thumbnailUrl} alt={copy.thumbnailAlt} className="aspect-video w-full max-w-xs rounded-2xl object-cover" />
          ) : (
            link.trim().length > 0 && <p className="text-xs text-muted-foreground">{copy.urlHint}</p>
          )}
          <button type="button" disabled={!parsed || full} onClick={addYoutube} className="secondary-action">
            <Plus size={16} aria-hidden /> {copy.addYoutube}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-4 text-sm">
          <label htmlFor={`${id}-file`} className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2 font-bold text-primary", full && "pointer-events-none opacity-50")}>
            <Plus size={16} aria-hidden /> {copy.upload}
          </label>
          <input
            id={`${id}-file`}
            type="file"
            accept={ACCEPT}
            disabled={full}
            className="sr-only"
            onChange={(event) => {
              pickFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">{copy.uploadHint}</p>
        </div>
      )}
      {message && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {message}
        </p>
      )}
      {pending.map((entry) => (
        <div key={entry.key} className="rounded-2xl border border-border bg-white p-3">
          <p className="truncate text-xs font-semibold">{entry.file.name}</p>
          {entry.error ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p role="alert" className="text-xs font-semibold text-destructive">
                {entry.error}
              </p>
              <button type="button" onClick={() => retry(entry)} className="secondary-action min-h-9 px-3 text-xs">
                <RefreshCw size={14} aria-hidden /> {copy.retry}
              </button>
              <button type="button" onClick={() => setPending((current) => current.filter((item) => item.key !== entry.key))} className="secondary-action min-h-9 px-3 text-xs">
                {copy.remove}
              </button>
            </div>
          ) : (
            <UploadProgress percent={entry.progress} label={entry.progress >= 100 ? copy.processing : copy.uploading(entry.progress)} className="mt-2" />
          )}
        </div>
      ))}
      {value.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={value.map((item) => item.key)} strategy={rectSortingStrategy}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {value.map((item) => (
                <SortableTile key={item.key} item={item} onRemove={() => remove(item.key)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
