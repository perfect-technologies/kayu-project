"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys, verificationApi } from "@kayu/api";
import type { UploadVerificationDocDto } from "@kayu/schemas";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifyStatus } from "@/components/verification/VerifyStatus";
import { VerifyWizard } from "@/components/verification/VerifyWizard";
import { errorMessage } from "@/copy/errors";
import { verificationCopy } from "@/copy/verification";
import { apiClient } from "@/lib/api";

const copy = verificationCopy;

export function VerificationClient() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const api = verificationApi(apiClient);

  const stateQuery = useQuery({ queryKey: queryKeys.verification.state, queryFn: () => api.state() });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.verification.state });

  const upload = useMutation({
    mutationFn: (dto: UploadVerificationDocDto) => api.uploadDoc(dto),
    onSuccess: invalidate,
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (docId: string) => api.removeDoc(docId),
    onSuccess: invalidate,
    onError: (error) => toast.error(errorMessage(error)),
  });
  const submit = useMutation({
    mutationFn: () => api.submit(),
    onSuccess: () => {
      void invalidate();
      setEditing(false);
      toast.success(copy.submitted);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const state = stateQuery.data;
  const hasSubmission = state ? state.state !== "NOT_STARTED" && state.state !== "IN_PROGRESS" : false;
  const locked = state ? state.state === "IN_REVIEW" || state.state === "VERIFIED" : true;
  const showWizard = state ? !hasSubmission || (editing && !locked) : false;

  return (
    <div className="mobile-page max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/mon-espace" className="icon-button" aria-label={copy.back}>
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <div className="min-w-0">
          <h1>{copy.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {stateQuery.isLoading && (
          <div aria-hidden className="space-y-4">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        )}
        {stateQuery.isError && (
          <div className="empty-state">
            <p className="text-sm font-semibold">{copy.loadError}</p>
            <button type="button" onClick={() => void stateQuery.refetch()} className="secondary-action mt-4">
              {copy.retry}
            </button>
          </div>
        )}
        {state && hasSubmission && <VerifyStatus state={state} onEdit={!locked && !editing ? () => setEditing(true) : undefined} />}
        {state && showWizard && (
          <VerifyWizard
            state={state}
            locked={locked}
            submitting={submit.isPending}
            onUploaded={async (input) => {
              await upload.mutateAsync(input);
            }}
            onRemove={async (docId) => {
              await remove.mutateAsync(docId);
            }}
            onSubmit={() => submit.mutate()}
          />
        )}
      </div>
    </div>
  );
}
