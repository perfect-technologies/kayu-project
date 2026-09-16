"use client";

import { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { identityApi } from "@kayu/api";
import { Field } from "@/components/forms/Field";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { useAuth } from "@/contexts/AuthContext";
import { compteCopy } from "@/copy/compte";
import { errorMessage } from "@/copy/errors";
import { apiClient } from "@/lib/api";
import { createClient } from "@/lib/supabase";

const copy = compteCopy.security;

/** Sign out, and account deletion behind a typed "SUPPRIMER" confirmation → `DELETE /me`. */
export function AccountSecurityCard() {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setTyped("");
    setError(null);
  };

  // After `DELETE /me` the Supabase user is gone: clear the local session, then reload on `/` so
  // the route guard on this page cannot race the context's own redirect and land on `/login`.
  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await identityApi(apiClient).deleteAccount();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
      return;
    }
    await createClient().auth.signOut();
    window.location.assign("/");
  };

  return (
    <section className="rounded-3xl border border-border bg-white p-5 shadow-soft">
      <h2 className="text-base font-extrabold text-foreground">{copy.title}</h2>
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{copy.logoutHint}</p>
          <button type="button" onClick={() => void signOut()} className="secondary-action">
            <LogOut size={15} aria-hidden /> {copy.logout}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">{copy.deleteHint}</p>
          <button type="button" onClick={() => setOpen(true)} className="secondary-action secondary-action--danger">
            <Trash2 size={15} aria-hidden /> {copy.delete}
          </button>
        </div>
      </div>

      <ConfirmSheet
        open={open}
        onClose={close}
        title={copy.deleteTitle}
        description={copy.deleteDescription}
        confirmLabel={copy.deleteConfirm}
        tone="danger"
        busy={busy}
        disabled={typed.trim() !== copy.deleteKeyword}
        onConfirm={() => void remove()}
        error={error}
      >
        <Field
          label={copy.deleteInputLabel(copy.deleteKeyword)}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
        />
      </ConfirmSheet>
    </section>
  );
}
