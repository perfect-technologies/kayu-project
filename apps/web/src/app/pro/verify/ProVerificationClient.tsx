"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { tokens } from "@kayu/ui";
import { VerifyStatus } from "./VerifyStatus";
import { VerifyWizard } from "./VerifyWizard";
import { DisputeView } from "./DisputeView";
import type { VerifyState } from "./fixtures";

type Flow = null | "wizard" | "dispute";

export function ProVerificationClient({ debug = false }: { debug?: boolean }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [state, setState] = useState<VerifyState>("not_started");
  const [flow, setFlow] = useState<Flow>(null);

  // Role gate — /pro/* is provider-only.
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== "PROVIDER") {
    return (
      <div
        style={{
          padding: 48,
          textAlign: "center",
          color: tokens.color.textMuted,
        }}
      >
        Chargement…
      </div>
    );
  }

  if (flow === "wizard") {
    return (
      <VerifyWizard
        onDone={() => {
          setFlow(null);
          setState("in_review");
          toast.success("Merci. Votre dossier est en cours d'examen.");
        }}
        onExit={() => setFlow(null)}
      />
    );
  }

  if (flow === "dispute") {
    return <DisputeView onBack={() => setFlow(null)} />;
  }

  return (
    <VerifyStatus
      state={state}
      setState={setState}
      onStart={() => {
        if (state === "verified") {
          router.push("/pro");
          return;
        }
        setFlow("wizard");
      }}
      onOpenDispute={() => setFlow("dispute")}
      hasDispute
      showDebug={debug}
    />
  );
}
