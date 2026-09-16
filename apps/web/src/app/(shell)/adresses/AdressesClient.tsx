"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { addressesApi, queryKeys } from "@kayu/api";
import type { Address, CreateAddressDto } from "@kayu/schemas";
import { AddressRow } from "@/components/addresses/AddressRow";
import { AddressSheet } from "@/components/addresses/AddressSheet";
import { AnimatedList } from "@/components/ui/animated-list";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { adressesCopy } from "@/copy/adresses";
import { errorMessage } from "@/copy/errors";
import { apiClient } from "@/lib/api";

const copy = adressesCopy;

type SheetState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; address: Address };

export function AdressesClient() {
  const queryClient = useQueryClient();
  const api = addressesApi(apiClient);
  const [sheet, setSheet] = useState<SheetState>({ mode: "closed" });
  const [toDelete, setToDelete] = useState<Address | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const list = useQuery({ queryKey: queryKeys.addresses.list(), queryFn: () => api.list() });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses"] });
  const closeSheet = () => {
    setSheet({ mode: "closed" });
    setSheetError(null);
  };

  const save = useMutation({
    mutationFn: ({ id, dto }: { id: string | null; dto: CreateAddressDto }) => (id ? api.update(id, dto) : api.create(dto)),
    onSuccess: async (_address, { id }) => {
      await invalidate();
      toast.success(id ? copy.toasts.updated : copy.toasts.created);
      closeSheet();
    },
    onError: (cause) => setSheetError(errorMessage(cause)),
  });
  const setDefault = useMutation({
    mutationFn: (id: string) => api.update(id, { isDefault: true }),
    onSuccess: async () => {
      await invalidate();
      toast.success(copy.toasts.defaultSet);
    },
    onError: (cause) => toast.error(errorMessage(cause)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: async () => {
      await invalidate();
      toast.success(copy.toasts.deleted);
      setToDelete(null);
      setDeleteError(null);
    },
    onError: (cause) => setDeleteError(errorMessage(cause)),
  });

  const items = list.data?.items ?? [];
  const busy = save.isPending || setDefault.isPending || remove.isPending;

  return (
    <div className="mobile-page max-w-3xl">
      <PageHeader
        title={copy.title}
        subtitle={list.data ? copy.subtitle(list.data.total) : undefined}
        back="/compte"
        backLabel={copy.backLabel}
        action={
          <button type="button" onClick={() => setSheet({ mode: "create" })} aria-label={copy.add} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Plus size={20} aria-hidden />
          </button>
        }
      />

      <div className="mt-6">
        {list.isLoading ? (
          <SkeletonList count={3} />
        ) : list.isError ? (
          <ErrorCard onRetry={() => void list.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={copy.empty.title}
            description={copy.empty.description}
            action={
              <button type="button" onClick={() => setSheet({ mode: "create" })} className="primary-action max-w-xs">
                {copy.add}
              </button>
            }
          />
        ) : (
          <AnimatedList
            items={items}
            keyOf={(address) => address.id}
            className="space-y-3"
            render={(address) => (
              <AddressRow
                address={address}
                busy={busy}
                onSetDefault={() => setDefault.mutate(address.id)}
                onEdit={() => setSheet({ mode: "edit", address })}
                onDelete={() => {
                  setDeleteError(null);
                  setToDelete(address);
                }}
              />
            )}
          />
        )}
      </div>

      <AddressSheet
        open={sheet.mode !== "closed"}
        onClose={closeSheet}
        address={sheet.mode === "edit" ? sheet.address : null}
        busy={save.isPending}
        error={sheetError}
        onSubmit={(dto) => save.mutate({ id: sheet.mode === "edit" ? sheet.address.id : null, dto })}
      />

      <ConfirmSheet
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={copy.confirmDelete.title}
        description={copy.confirmDelete.description}
        confirmLabel={copy.confirmDelete.confirm}
        tone="danger"
        busy={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        error={deleteError}
      />
    </div>
  );
}
