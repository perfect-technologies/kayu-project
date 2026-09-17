"use client";

import { Briefcase, User } from "lucide-react";
import { authCopy } from "@/copy/auth";
import type { SignupIntent } from "@/lib/auth-return-to";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: SignupIntent; Icon: typeof User; label: string }> = [
  { value: "client", Icon: User, label: authCopy.register.accountType.client },
  { value: "provider", Icon: Briefcase, label: authCopy.register.accountType.provider },
];

/** Two-up bordered buttons; the choice is a routing hint stored in sessionStorage, never a role. */
export function AccountTypeSelector({ value, onChange, disabled }: { value: SignupIntent; onChange: (value: SignupIntent) => void; disabled?: boolean }) {
  return (
    <fieldset className="grid grid-cols-2 gap-3">
      <legend className="sr-only">{authCopy.register.accountType.legend}</legend>
      {OPTIONS.map(({ value: option, Icon, label }) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              "min-h-[88px] rounded-2xl border p-4 text-left text-sm font-semibold transition",
              selected ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-foreground hover:bg-secondary/40",
            )}
          >
            <Icon size={20} aria-hidden className="mb-2" />
            {label}
          </button>
        );
      })}
    </fieldset>
  );
}
