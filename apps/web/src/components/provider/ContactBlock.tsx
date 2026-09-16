"use client";

import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import type { ProviderPublic } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { whatsappLink } from "@/lib/dto/provider";
import { ContactsLocked } from "./ContactsLocked";

const copy = providerCopy.contact;

export function ContactBlock({
  provider,
  whatsappEnabled,
  canMessage,
  onMessage,
}: {
  provider: ProviderPublic;
  whatsappEnabled: boolean;
  canMessage: boolean;
  onMessage: () => void;
}) {
  const contacts = provider.contacts;
  const whatsapp = whatsappEnabled ? contacts?.whatsapp || contacts?.phone || null : null;

  return (
    <div className="mt-4 space-y-3">
      {provider.blocked ? (
        <p className="rounded-2xl border border-border bg-muted p-4 text-center text-sm text-muted-foreground">{copy.blocked}</p>
      ) : (
        canMessage && (
          <button
            type="button"
            onClick={onMessage}
            className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-[15px] font-bold text-primary-foreground shadow-soft"
          >
            <Send size={18} aria-hidden /> {copy.message}
          </button>
        )
      )}

      {provider.contactsLocked || !contacts ? (
        <ContactsLocked />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {contacts.phone && (
            <a
              href={`tel:${contacts.phone}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 font-semibold text-foreground shadow-soft transition hover:bg-muted"
            >
              <Phone size={18} aria-hidden /> {copy.call}
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsappLink(whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 font-semibold text-white shadow-soft transition hover:bg-emerald-600"
            >
              <MessageCircle size={18} aria-hidden /> {copy.whatsapp}
            </a>
          )}
          {contacts.email && (
            <a
              href={`mailto:${contacts.email}`}
              className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 font-semibold text-foreground shadow-soft transition hover:bg-muted"
            >
              <Mail size={18} aria-hidden /> <span className="truncate">{contacts.email}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
