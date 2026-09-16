"use client";

import { LogOut, ShieldOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { shellCopy } from "@/copy/shell";
import { Logo } from "./Logo";

export function SuspendedScreen() {
  const { suspendedReason, signOut } = useAuth();
  const copy = shellCopy.suspended;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10 text-center">
      <Logo size={36} className="mb-8" />
      <section className="w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-soft">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldOff size={30} aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-foreground">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
        {suspendedReason && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-semibold">{copy.reason} : </span>
            {suspendedReason}
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">{copy.support}</p>
        <button type="button" onClick={() => void signOut()} className="primary-action mt-6">
          <LogOut size={16} aria-hidden />
          {copy.logout}
        </button>
      </section>
    </main>
  );
}
