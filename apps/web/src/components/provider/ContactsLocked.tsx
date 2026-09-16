import Link from "next/link";
import { Lock, MessageCircle, Phone } from "lucide-react";
import { providerCopy } from "@/copy/provider";

const copy = providerCopy.contact;

/** Blurred fake contact block with the "Contacts verrouillés" overlay and a link to /premium. */
export function ContactsLocked() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-muted p-4">
      <div aria-hidden className="grid grid-cols-2 gap-3 select-none blur-sm">
        <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 font-semibold text-muted-foreground">
          <Phone size={18} /> {copy.maskedNumber}
        </span>
        <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-muted-foreground/20 px-4 font-semibold text-muted-foreground">
          <MessageCircle size={18} /> {copy.maskedNumber}
        </span>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 p-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          <Lock size={12} aria-hidden /> {copy.locked}
        </span>
        <p className="max-w-xs text-xs text-muted-foreground">{copy.lockedHint}</p>
        <Link href="/premium" className="inline-flex min-h-9 items-center rounded-full bg-accent px-4 text-xs font-bold text-accent-foreground">
          {copy.lockedCta}
        </Link>
      </div>
    </div>
  );
}
