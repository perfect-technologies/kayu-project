"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys, verificationApi } from "@kayu/api";
import type {
  UploadVerificationDocDtoType,
  VerificationState,
} from "@kayu/schemas";
import { ErrorState } from "@kayu/ui/web";
import { tokens } from "@kayu/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { VerifyStatus } from "./VerifyStatus";
import { VerifyWizard } from "./VerifyWizard";
import { DisputeView } from "./DisputeView";

type Flow = null | "wizard" | "dispute";

export function ProVerificationClient({ debug = false }: { debug?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const [flow, setFlow] = useState<Flow>(null);
  const [debugState, setDebugState] = useState<VerificationState | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [isLoading, user, router]);

  const enabled = Boolean(user && user.role === "PROVIDER");

  const stateQuery = useQuery({
    queryKey: queryKeys.verification.state,
    queryFn: () => verificationApi(apiClient).getState(),
    enabled,
  });

  const disputeQuery = useQuery({
    queryKey: queryKeys.verification.dispute,
    queryFn: () => verificationApi(apiClient).getDispute(),
    enabled,
  });

  const uploadMut = useMutation({
    mutationFn: (data: UploadVerificationDocDtoType) =>
      verificationApi(apiClient).uploadDoc(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.verification.state }),
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Téléversement impossible";
      toast.error(msg);
    },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => verificationApi(apiClient).removeDoc(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.verification.state }),
  });

  const submitMut = useMutation({
    mutationFn: () => verificationApi(apiClient).submit(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.verification.state });
      toast.success("Merci. Votre dossier est en cours d'examen.");
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Soumission impossible";
      toast.error(msg);
    },
  });

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

  if (stateQuery.isLoading) {
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

  if (stateQuery.isError || !stateQuery.data) {
    return (
      <div style={{ padding: 40, maxWidth: 720, margin: "0 auto" }}>
        <ErrorState
          title="Impossible de charger votre vérification"
          subtitle="Vérifiez votre connexion puis réessayez."
          cta={{ label: "Réessayer", onClick: () => stateQuery.refetch() }}
        />
      </div>
    );
  }

  const liveState = stateQuery.data;
  const dispute = disputeQuery.data?.dispute ?? null;
  const effectiveStateValue = debug && debugState ? debugState : liveState.state;

  if (flow === "wizard") {
    return (
      <VerifyWizard
        uploadedKinds={liveState.docs.map((d) => d.kind)}
        isUploading={uploadMut.isPending}
        isSubmitting={submitMut.isPending}
        onUpload={async (data) => {
          await uploadMut.mutateAsync(data);
        }}
        onSubmitForReview={async () => {
          await submitMut.mutateAsync();
          setFlow(null);
        }}
        onExit={() => setFlow(null)}
      />
    );
  }

  if (flow === "dispute" && dispute) {
    return (
      <DisputeView
        dispute={dispute}
        onBack={() => setFlow(null)}
        onResolved={() => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.verification.dispute,
          });
          setFlow(null);
        }}
      />
    );
  }

  return (
    <VerifyStatus
      state={effectiveStateValue}
      liveState={liveState}
      hasDispute={Boolean(dispute)}
      onStart={() => {
        if (effectiveStateValue === "VERIFIED") {
          router.push("/pro");
          return;
        }
        setFlow("wizard");
      }}
      onOpenDispute={() => setFlow("dispute")}
      onRemoveDoc={(id) => {
        removeMut.mutate(id);
      }}
      showDebug={debug}
      debugState={debugState}
      onDebugState={setDebugState}
    />
  );
}
