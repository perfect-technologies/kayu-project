"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { providersApi, queryKeys } from "@kayu/api";
import type { ProviderDashboardResponse } from "@kayu/schemas";
import { errorMessage } from "@/copy/errors";
import { espaceCopy } from "@/copy/espace";
import { apiClient } from "@/lib/api";

const copy = espaceCopy.banner;

export type StatusBannerProps = {
  isAvailable: boolean;
  hidden: boolean;
};

/** Emerald banner with the visibility state and the availability toggle (optimistic on the dashboard cache). */
export function StatusBanner({ isAvailable, hidden }: StatusBannerProps) {
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const key = queryKeys.dashboard.provider;

  const toggle = useMutation({
    mutationFn: (next: boolean) => providersApi(apiClient).setAvailability(next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ProviderDashboardResponse>(key);
      if (previous) {
        queryClient.setQueryData<ProviderDashboardResponse>(key, {
          ...previous,
          provider: { ...previous.provider, isAvailable: next },
        });
      }
      return { previous };
    },
    onError: (error, _next, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: (_data, next) => {
      toast.success(next ? copy.toastAvailable : copy.toastUnavailable);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  const visible = isAvailable && !hidden;
  const title = visible ? copy.visibleTitle : copy.hiddenTitle;
  const subtitle = hidden ? copy.adminHiddenSubtitle : visible ? copy.visibleSubtitle : copy.hiddenSubtitle;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand">
      <TrendingUp aria-hidden size={220} strokeWidth={1.2} className="pointer-events-none absolute -right-8 -bottom-10 text-white/10" />
      <div className="relative flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15">
          {visible ? <Eye size={22} aria-hidden /> : <EyeOff size={22} aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold sm:text-xl">{title}</h2>
          <p className="mt-1 text-sm text-primary-foreground/75">{subtitle}</p>
        </div>
      </div>
      {!hidden && (
        <motion.button
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.975 }}
          disabled={toggle.isPending}
          onClick={() => toggle.mutate(!isAvailable)}
          className="relative mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-primary disabled:opacity-55"
        >
          {isAvailable ? copy.goUnavailable : copy.goAvailable}
        </motion.button>
      )}
    </section>
  );
}
