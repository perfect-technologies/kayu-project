"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { providersApi, queryKeys } from "@kayu/api";
import { AvailabilitySheet } from "./AvailabilitySheet";

export type AvailabilityChipProps = {
  isAvailable: boolean;
  zoneCity: string;
  zoneRadiusKm: number;
};

export function AvailabilityChip(props: AvailabilityChipProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      providersApi(apiClient).updateAvailability({ isAvailable: next }),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.provider });
      const prev = queryClient.getQueryData(queryKeys.dashboard.provider);
      queryClient.setQueryData(
        queryKeys.dashboard.provider,
        (old: any) =>
          old
            ? {
                ...old,
                availability: { ...old.availability, isAvailable: next },
                provider: { ...old.provider, isAvailable: next },
              }
            : old,
      );
      return { prev };
    },
    onError: (_err, _value, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.dashboard.provider, context.prev);
      }
      toast.error("Impossible de mettre à jour ta disponibilité.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.search() });
    },
  });

  const label = props.isAvailable
    ? `Disponible · ${props.zoneCity}, ${props.zoneRadiusKm} km`
    : "Indisponible";

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
        className="k-pd-avail-chip"
        data-on={props.isAvailable}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          fontSize: 11.5,
          fontFamily: "var(--font-body)",
          border: `1px solid ${props.isAvailable ? "#A7F3D0" : "var(--k-border)"}`,
          borderRadius: 999,
          background: props.isAvailable ? "var(--k-success-subtle)" : "#F1F5F9",
          color: props.isAvailable ? "#047857" : "var(--k-text-body)",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: props.isAvailable ? "var(--k-success)" : "var(--k-border-strong)",
            boxShadow: props.isAvailable ? "0 0 0 4px rgba(16,185,129,0.18)" : "none",
            flexShrink: 0,
          }}
        />
        {label}
      </button>
      <AvailabilitySheet
        isOpen={sheetOpen}
        isAvailable={props.isAvailable}
        zoneCity={props.zoneCity}
        zoneRadiusKm={props.zoneRadiusKm}
        pending={mutation.isPending}
        onToggle={(next) => mutation.mutate(next)}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
