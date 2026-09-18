"use client";

import { MapPin } from "lucide-react";
import type { Address, ProviderCard, ProviderPublic } from "@kayu/schemas";
import { SkeletonLines } from "@/components/ui/skeleton";
import { assistantCopy } from "@/copy/assistant";
import { ActivityCard } from "./ActivityCard";
import { AddressCard, type AddressCardMode } from "./AddressCard";
import { AvailabilityCard, AvailabilityCardSkeleton } from "./AvailabilityCard";
import { BookingApprovalCard, type ApprovalState } from "./BookingApprovalCard";
import { MessageApprovalCard } from "./MessageApprovalCard";
import { ProviderDetailCard, ProviderDetailCardSkeleton } from "./ProviderDetailCard";
import { ProviderPickList, ProviderPickListSkeleton } from "./ProviderPickList";
import { BookingStatusCard, MessageStatusCard } from "./StatusCard";
import { stripAddressMarker, type AssistantUIMessage, type KnownProvider, type PickedSlot } from "./types";

const copy = assistantCopy.tools;

export type AssistantMessageActions = {
  onChoose: (provider: ProviderCard) => void;
  onSlots: (provider: ProviderPublic) => void;
  onPickSlot: (providerId: string, date: string, time: string) => void;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
  onRevise: (approvalId: string, text: string) => void;
  onPickAddress: (address: Address) => void;
  onAddressCreated: (address: Address, asDefault: boolean) => void;
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

// Only the last assistant message can still be answered; an older pending request was superseded server-side.
function approvalState(part: { state: string; approval?: { approved?: boolean; reason?: string } }, actionable: boolean): ApprovalState {
  if (part.state === "approval-requested" && actionable) return { state: "approval-requested" };
  if (part.state === "approval-requested") return { state: "approval-responded", approved: false, reason: assistantCopy.approval.superseded };
  return { state: "approval-responded", approved: part.approval?.approved ?? false, reason: part.approval?.reason };
}

export function AssistantMessage({
  message,
  busy,
  isLast,
  chosenIds,
  picked,
  known,
  whatsappEnabled,
  addressCard,
  actions,
}: {
  message: AssistantUIMessage;
  busy: boolean;
  isLast: boolean;
  chosenIds: Set<string>;
  picked: PickedSlot | null;
  known: Map<string, KnownProvider>;
  whatsappEnabled: boolean;
  addressCard: AddressCardMode | null;
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
  const actionable = isLast && !busy;

  return (
    <div className="flex flex-col gap-3">
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;

        if (part.type === "text") {
          const { text } = stripAddressMarker(part.text);
          if (!text.trim()) return null;
          return (
            <p key={key} className="max-w-[92%] text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {text}
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

        if (part.type === "tool-get_my_activity") {
          if (part.state === "output-error" || (part.state !== "output-available" && !busy)) return <MutedLine key={key}>{copy.activityError}</MutedLine>;
          if (part.state !== "output-available") return <SkeletonLines key={key} lines={3} />;
          return <ActivityCard key={key} output={part.output} />;
        }

        if (part.type === "tool-create_booking") {
          if (part.state === "approval-requested" || part.state === "approval-responded") {
            return (
              <BookingApprovalCard
                key={key}
                input={part.input}
                provider={known.get(part.input.providerId) ?? null}
                approval={approvalState(part, actionable)}
                disabled={busy}
                onApprove={() => actions.onApprove(part.approval.id)}
                onDeny={() => actions.onDeny(part.approval.id)}
              />
            );
          }
          if (part.state === "input-streaming" || part.state === "input-available") return busy ? <SkeletonLines key={key} lines={2} /> : null;
          return <BookingStatusCard key={key} part={part} />;
        }

        if (part.type === "tool-send_message") {
          if (part.state === "approval-requested" || part.state === "approval-responded") {
            return (
              <MessageApprovalCard
                key={key}
                input={part.input}
                provider={known.get(part.input.providerId) ?? null}
                approval={approvalState(part, actionable)}
                disabled={busy}
                onApprove={() => actions.onApprove(part.approval.id)}
                onDeny={() => actions.onDeny(part.approval.id)}
                onRevise={(text) => actions.onRevise(part.approval.id, text)}
              />
            );
          }
          if (part.state === "input-streaming" || part.state === "input-available") return busy ? <SkeletonLines key={key} lines={2} /> : null;
          return <MessageStatusCard key={key} part={part} />;
        }

        return null;
      })}
      {addressCard && isLast && !busy && (
        <AddressCard mode={addressCard} disabled={busy} onPick={actions.onPickAddress} onCreated={actions.onAddressCreated} />
      )}
    </div>
  );
}
