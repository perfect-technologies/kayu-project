"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@kayu/api";
import { toast } from "sonner";
import { adminErrorMessage } from "./admin-errors";

type Options<TArgs, TResult> = {
  mutationFn: (args: TArgs) => Promise<TResult>;
  /** Query key prefixes to invalidate on success; `admin.overview` and `admin.audit` are always added. */
  invalidate?: ReadonlyArray<readonly unknown[]>;
  success?: string | ((result: TResult, args: TArgs) => string);
  onSuccess?: (result: TResult, args: TArgs) => void;
  /** Skip the error toast (the caller shows the error inline). */
  silent?: boolean;
};

/** Admin mutation: toast on success and on API error, invalidate the section plus the overview and the journal. */
export function useAdminMutation<TArgs, TResult>({ mutationFn, invalidate = [], success, onSuccess, silent }: Options<TArgs, TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (result, args) => {
      const keys = [...invalidate, queryKeys.admin.overview, queryKeys.admin.audit];
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      if (success) toast.success(typeof success === "function" ? success(result, args) : success);
      onSuccess?.(result, args);
    },
    onError: (error) => {
      if (!silent) toast.error(adminErrorMessage(error));
    },
  });
}
