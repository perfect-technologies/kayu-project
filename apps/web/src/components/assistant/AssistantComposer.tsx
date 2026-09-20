"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { assistantCopy } from "@/copy/assistant";

const copy = assistantCopy.composer;
export const COMPOSER_INPUT_ID = "assistant-composer-input";

export function AssistantComposer({
  onSend,
  disabled,
  autoFocus,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 rounded-full border border-border bg-white p-1.5 pl-4 shadow-soft">
      <Sparkles size={18} aria-hidden className="shrink-0 text-primary" />
      <label className="min-w-0 flex-1">
        <span className="sr-only">{copy.label}</span>
        <input
          id={COMPOSER_INPUT_ID}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={copy.placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="send"
          maxLength={1000}
          className="h-11 w-full min-w-0 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      <button
        type="submit"
        aria-label={copy.send}
        disabled={disabled || value.trim() === ""}
        className="icon-button border-transparent bg-accent text-accent-foreground"
      >
        <ArrowRight size={18} aria-hidden />
      </button>
    </form>
  );
}
