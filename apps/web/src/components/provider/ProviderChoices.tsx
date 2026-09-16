import type { ProviderPublic } from "@kayu/schemas";
import { formatNumber } from "@kayu/utils";
import { providerCopy } from "@/copy/provider";

const copy = providerCopy.choices;

function ChipGroup({ label, items }: { label: string; items: Array<{ id: string; label: string }> }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id} className="inline-flex min-h-9 items-center rounded-full bg-secondary px-3 text-xs font-semibold text-foreground">
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Languages, intervention modes and the indicative price. Server-safe. */
export function ProviderChoices({ provider }: { provider: Pick<ProviderPublic, "languages" | "interventionModes" | "pricing"> }) {
  const pricing = provider.pricing;
  if (provider.languages.length === 0 && provider.interventionModes.length === 0 && !pricing) return null;
  return (
    <section className="space-y-4">
      <ChipGroup label={copy.languages} items={provider.languages} />
      <ChipGroup label={copy.modes} items={provider.interventionModes} />
      {pricing && (
        <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{copy.pricing}</p>
          <p className="mt-1 font-bold text-foreground">
            {copy.pricingFrom(`${formatNumber(pricing.amount)} ${pricing.currency?.label ?? ""}`.trim(), pricing.unit?.label ?? "")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.pricingHint}</p>
        </div>
      )}
    </section>
  );
}
