"use client";

import { useState } from "react";
import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { shellCopy } from "@/copy/shell";
import { AuthCanvas } from "./AuthCanvas";

export function AcceptTermsScreen() {
  const { acceptTerms } = useAuth();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = shellCopy.acceptTerms;

  const submit = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await acceptTerms();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCanvas>
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <FileCheck2 size={26} aria-hidden />
      </span>
      <p className="mt-6 text-[10px] font-extrabold tracking-[.19em] text-muted-foreground uppercase">
        {copy.eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{copy.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{copy.description}</p>
      <ul className="mt-5 space-y-2 text-sm font-semibold">
        <li>
          <Link href="/cgu" target="_blank" className="text-primary underline underline-offset-4">
            {copy.terms}
          </Link>
        </li>
        <li>
          <Link href="/confidentialite" target="_blank" className="text-primary underline underline-offset-4">
            {copy.privacy}
          </Link>
        </li>
      </ul>
      {failed && (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {copy.error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy}
        aria-busy={busy}
        className="primary-action primary-action--gold mt-6"
      >
        {copy.action}
      </button>
    </AuthCanvas>
  );
}
