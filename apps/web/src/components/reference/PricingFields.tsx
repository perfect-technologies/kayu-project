"use client";

import { providerCopy } from "@/copy/provider";
import { Choice } from "./Choice";
import { useReferences } from "./useReferences";

const copy = providerCopy.references;

export type PricingValue = { amount: number; currencyId: string; unitId: string };

export type PricingFieldsProps = {
  value: PricingValue | null;
  onChange: (value: PricingValue | null) => void;
  className?: string;
};

/** Checkbox revealing amount + currency + unit (references CURRENCY and PRICE_UNIT). */
export function PricingFields({ value, onChange, className }: PricingFieldsProps) {
  const currencies = useReferences("CURRENCY").items;
  const units = useReferences("PRICE_UNIT").items;

  return (
    <section className={`space-y-3 rounded-2xl border border-border bg-white p-4 ${className ?? ""}`}>
      <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          checked={value !== null}
          onChange={(event) =>
            onChange(
              event.target.checked
                ? { amount: 0, currencyId: currencies[0]?.id ?? "", unitId: units[0]?.id ?? "" }
                : null,
            )
          }
          className="size-4 accent-primary"
        />
        {copy.pricingToggle}
      </label>
      {value && (
        <>
          <label className="block text-xs font-bold">
            {copy.pricingAmount}
            <input
              type="number"
              min={0}
              max={1_000_000_000}
              step={1}
              inputMode="numeric"
              value={value.amount}
              onChange={(event) => onChange({ ...value, amount: Math.max(0, Math.floor(Number(event.target.value) || 0)) })}
              className="field mt-1"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Choice label={copy.pricingCurrency} options={currencies} value={value.currencyId} onChange={(currencyId) => onChange({ ...value, currencyId })} />
            <Choice label={copy.pricingUnit} options={units} value={value.unitId} onChange={(unitId) => onChange({ ...value, unitId })} />
          </div>
        </>
      )}
    </section>
  );
}
