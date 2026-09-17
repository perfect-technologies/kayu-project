"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getInitials } from "@kayu/utils";
import { useAuth } from "@/contexts/AuthContext";
import { authCopy } from "@/copy/auth";
import { FormError, Spinner } from "@/components/forms/Field";
import { postAuthDestination, readSignupIntent, clearSignupIntent } from "@/lib/auth-return-to";
import { cn } from "@/lib/utils";

// Seed password of `apps/backend/prisma/seed-demo.ts`; the whole panel is compiled out in production.
const DEMO_PASSWORD = "Password123!";

/** Dev-only collapsible block under the auth card: `signInWithPassword` on the seeded accounts. */
export function DemoAccountsPanel({ returnTo }: { returnTo: string | null }) {
  const { login } = useAuth();
  const router = useRouter();
  const copy = authCopy.demo;
  const [open, setOpen] = useState(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NODE_ENV === "production") return null;

  const pick = async (email: string) => {
    setBusyEmail(email);
    setError(null);
    try {
      const user = await login(email, DEMO_PASSWORD);
      if (!user) throw new Error(authCopy.errors.sessionMissing);
      const destination = postAuthDestination(user, { returnTo, signupIntent: readSignupIntent() });
      clearSignupIntent();
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : authCopy.errors.generic);
      setBusyEmail(null);
    }
  };

  return (
    <section className="mx-auto mt-5 w-full max-w-md rounded-2xl border border-dashed border-border bg-white/70 p-4">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-9 w-full items-center justify-between text-left">
        <span>
          <span className="block text-[10px] font-extrabold tracking-[.19em] text-muted-foreground uppercase">{copy.eyebrow}</span>
          <span className="block text-xs text-muted-foreground">{copy.description}</span>
        </span>
        <ChevronDown size={16} aria-hidden className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <FormError message={error} />
          {copy.accounts.map((account) => {
            const busy = busyEmail === account.email;
            return (
              <button
                key={account.email}
                type="button"
                disabled={busyEmail !== null}
                onClick={() => void pick(account.email)}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 text-left transition hover:bg-secondary/40 disabled:opacity-55"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-xs font-extrabold text-primary">
                  {busy ? <Spinner className="size-4" /> : getInitials(account.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {account.role} · {account.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{busy ? copy.signingIn : account.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
