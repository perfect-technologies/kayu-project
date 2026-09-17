"use client";

import { MapPin } from "lucide-react";
import type { ProviderCard, ProviderPublic } from "@kayu/schemas";
import { assistantCopy } from "@/copy/assistant";
import { AvailabilityCard, AvailabilityCardSkeleton } from "./AvailabilityCard";
import { ProviderDetailCard, ProviderDetailCardSkeleton } from "./ProviderDetailCard";
import { ProviderPickList, ProviderPickListSkeleton } from "./ProviderPickList";
import type { AssistantUIMessage, PickedSlot } from "./types";

const copy = assistantCopy.tools;

export type AssistantMessageActions = {
  onChoose: (provider: ProviderCard) => void;
  onSlots: (provider: ProviderPublic) => void;
  onPickSlot: (providerId: string, date: string, time: string) => void;
};

function MutedLine({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function searchHref(input: { placeId?: string; q?: string } | undefined): string {
  const params = new URLSearchParams();
  if (input?.placeId) params.set("place", input.placeId);
  if (input?.q) params.set("q", input.q);
  const query = params.toString();
  return query ? `/rechercher?${query}` : "/rechercher";
}

export function AssistantMessage({
  message,
  busy,
  chosenIds,
  picked,
  whatsappEnabled,
  actions,
}: {
  message: AssistantUIMessage;
  busy: boolean;
  chosenIds: Set<string>;
  picked: PickedSlot | null;
  whatsappEnabled: boolean;
  actions: AssistantMessageActions;
}) {
  if (message.role === "user") {
    const text = message.parts
      .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
      .map((part) => part.text)
      .join("\n");
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">{text}</p>
      </div>
    );
  }

  // The fallback ladder can search several times in one answer: only the last search gets the dashed empty state.
  const lastSearchIndex = message.parts.reduce((last, part, index) => (part.type === "tool-search_providers" ? index : last), -1);

  return (
    <div className="flex flex-col gap-3">
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;

        if (part.type === "text") {
          if (!part.text.trim()) return null;
          return (
            <p key={key} className="max-w-[92%] text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {part.text}
            </p>
          );
        }

        if (part.type === "tool-find_place") {
          if (part.state !== "output-available") return null;
          const first = part.output.items[0];
          return (
            <MutedLine key={key}>
              <MapPin size={12} aria-hidden className="mr-1 inline-block align-[-2px]" />
              {first ? copy.place(first.chain.map((place) => place.label).join(" › ")) : copy.placeMissing}
            </MutedLine>
          );
        }

        if (part.type === "tool-search_providers") {
          if (part.state === "output-error" || (part.state !== "output-available" && !busy)) return <MutedLine key={key}>{copy.searchError}</MutedLine>;
          if (part.state !== "output-available") return <ProviderPickListSkeleton key={key} />;
          if (part.output.items.length === 0 && index !== lastSearchIndex) return <MutedLine key={key}>{copy.widened}</MutedLine>;
          return (
            <ProviderPickList
              key={key}
              output={part.output}
              searchHref={searchHref(part.input)}
              chosenIds={chosenIds}
              disabled={busy}
              onChoose={actions.onChoose}
            />
          );
        }

        if (part.type === "tool-get_provider") {
          if (part.state === "output-error" || (part.state !== "output-available" && !busy)) return <MutedLine key={key}>{copy.detailError}</MutedLine>;
          if (part.state !== "output-available") return <ProviderDetailCardSkeleton key={key} />;
          return <ProviderDetailCard key={key} provider={part.output} whatsappEnabled={whatsappEnabled} disabled={busy} onSlots={actions.onSlots} />;
        }

        if (part.type === "tool-get_provider_availability") {
          if (part.state === "output-error" || (part.state !== "output-available" && !busy)) return <MutedLine key={key}>{copy.availabilityError}</MutedLine>;
          if (part.state !== "output-available") return <AvailabilityCardSkeleton key={key} />;
          return (
            <AvailabilityCard
              key={key}
              output={part.output}
              picked={picked}
              disabled={busy}
              onPick={(date, time) => actions.onPickSlot(part.output.providerId, date, time)}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
