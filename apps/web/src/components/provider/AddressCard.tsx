import { MapPin, Route } from "lucide-react";
import type { PlaceSummary, ProviderContacts } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { placeChainLabel } from "@/lib/dto/provider";

const copy = providerCopy.address;

/** Address line, place chain and a Google Maps "Itinéraire" link. Signed-in, unlocked viewers only. */
export function AddressCard({ contacts, placeChain }: { contacts: ProviderContacts; placeChain: PlaceSummary[] }) {
  const chain = placeChainLabel(placeChain);
  if (!contacts.addressLine && !chain) return null;
  const hasPoint = contacts.latitude !== null && contacts.longitude !== null;
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-foreground">
        <MapPin size={16} aria-hidden className="text-primary" /> {copy.title}
      </h2>
      {contacts.addressLine && <p className="text-sm text-foreground/80">{contacts.addressLine}</p>}
      {chain && <p className="text-sm text-muted-foreground">{chain}</p>}
      {hasPoint && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${contacts.latitude},${contacts.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-bold text-primary"
        >
          <Route size={15} aria-hidden /> {copy.directions}
        </a>
      )}
    </section>
  );
}
