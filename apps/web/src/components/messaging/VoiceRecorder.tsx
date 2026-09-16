"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Mic, X } from "lucide-react";
import { messagerieCopy } from "@/copy/messagerie";

const copy = messagerieCopy.recorder;
export const MAX_RECORDING_MS = 2 * 60 * 1000;

export type VoiceRecorderProps = {
  onRecorded: (file: File) => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
};

function pickMime(): string {
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "audio/mp4";
}

function clock(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** MediaRecorder voice note: `audio/webm` (else `audio/mp4`), 2-minute cap, timer pill, cancel / confirm. */
export function VoiceRecorder({ onRecorded, onError, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const keep = useRef(false);
  const startedAt = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = () => {
    if (ticker.current) clearInterval(ticker.current);
    if (capTimer.current) clearTimeout(capTimer.current);
    ticker.current = null;
    capTimer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
    setRecording(false);
    setElapsed(0);
  };

  useEffect(() => () => cleanup(), []);

  const finish = (confirm: boolean) => {
    keep.current = confirm;
    const instance = recorder.current;
    if (instance && instance.state !== "inactive") instance.stop();
    else cleanup();
  };

  const start = async () => {
    onError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onError(copy.unsupported);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mime = pickMime();
      const instance = new MediaRecorder(media, { mimeType: mime });
      chunks.current = [];
      keep.current = false;
      instance.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      instance.onstop = () => {
        const type = instance.mimeType.split(";")[0] || mime;
        if (keep.current && chunks.current.length > 0) {
          const blob = new Blob(chunks.current, { type });
          const extension = type.endsWith("mp4") ? "m4a" : "webm";
          onRecorded(new File([blob], `voix-${Date.now()}.${extension}`, { type }));
        }
        cleanup();
      };
      instance.start(250);
      recorder.current = instance;
      startedAt.current = Date.now();
      setRecording(true);
      setElapsed(0);
      ticker.current = setInterval(() => setElapsed(Date.now() - startedAt.current), 250);
      capTimer.current = setTimeout(() => {
        onError(copy.maxReached);
        finish(true);
      }, MAX_RECORDING_MS);
    } catch {
      onError(copy.micUnavailable);
      cleanup();
    }
  };

  if (!recording) {
    return (
      <button
        type="button"
        onClick={() => void start()}
        disabled={disabled}
        aria-label={copy.record}
        className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-primary disabled:opacity-55"
      >
        <Mic size={18} aria-hidden />
      </button>
    );
  }

  return (
    <span className="inline-flex h-11 items-center gap-1 rounded-full bg-red-50 pl-3 text-red-600" role="status" aria-live="polite">
      <span aria-hidden className="size-2 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none" />
      <span className="text-xs font-bold tabular-nums">
        <span className="sr-only">{copy.recording} </span>
        {clock(elapsed)}
      </span>
      <button type="button" onClick={() => finish(false)} aria-label={copy.cancel} className="flex size-11 items-center justify-center rounded-full hover:bg-red-100">
        <X size={16} aria-hidden />
      </button>
      <button type="button" onClick={() => finish(true)} aria-label={copy.confirm} className="flex size-11 items-center justify-center rounded-full text-primary hover:bg-red-100">
        <Check size={18} aria-hidden />
      </button>
    </span>
  );
}
