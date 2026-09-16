"use client";

import { Briefcase, Home, MapPin, Pencil, Star, Trash2, type LucideIcon } from "lucide-react";
import type { Address, AddressLabel } from "@kayu/schemas";
import { adressesCopy } from "@/copy/adresses";
import { cn } from "@/lib/utils";

const copy = adressesCopy;

const KIND: Record<AddressLabel, { icon: LucideIcon; className: string }> = {
  HOME: { icon: Home, className: "bg-emerald-50 text-emerald-700" },
  WORK: { icon: Briefcase, className: "bg-blue-50 text-blue-600" },
  OTHER: { icon: MapPin, className: "bg-amber-50 text-amber-700" },
};

/** "Commune · Ville · RD Congo": deepest place first, country last. */
export function placeChainLine(address: Pick<Address, "placeChain">): string {
  return [...address.placeChain]
    .reverse()
    .map((place) => place.label)
    .join(" · ");
}

export function AddressRow({
  address,
  onSetDefault,
  onEdit,
  onDelete,
  busy,
}: {
  address: Address;
  onSetDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
  busy?: boolean;
}) {
  const { icon: Icon, className } = KIND[address.label];
  const chain = placeChainLine(address);
  const title = address.recipient ? `${copy.labels[address.label]} · ${address.recipient}` : copy.labels[address.label];
  return (
    <article className="rounded-3xl border border-border bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", className)}>
          <Icon size={20} aria-hidden strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-extrabold text-foreground">{title}</p>
            {address.isDefault && (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-amber-50 px-2 text-[11px] font-semibold text-amber-700">
                <Star size={11} aria-hidden className="fill-current" /> {copy.default}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-foreground">{address.addressLine}</p>
          {chain && <p className="text-xs text-muted-foreground">{chain}</p>}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {!address.isDefault && (
          <button type="button" onClick={onSetDefault} disabled={busy} className="icon-button text-amber-600" aria-label={copy.setDefault}>
            <Star size={18} aria-hidden />
          </button>
        )}
        <button type="button" onClick={onEdit} disabled={busy} className="icon-button" aria-label={copy.edit}>
          <Pencil size={18} aria-hidden />
        </button>
        <button type="button" onClick={onDelete} disabled={busy} className="icon-button text-destructive" aria-label={copy.remove}>
          <Trash2 size={18} aria-hidden />
        </button>
      </div>
    </article>
  );
}
