"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { ApiError, toApiError } from "@/services/v2/client";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

interface UseAdminActionOptions {
  /** Queries to refetch after the action, whether it worked or not. */
  invalidate?: QueryKey[];
}

/**
 * Runs one admin mutation at a time. A second call while the first is in
 * flight is ignored (a ref, not state, so even two clicks in the same frame
 * send one request). Afterwards it refetches `invalidate` on success *and*
 * on failure: a 400/409 usually means the record changed under us, and the
 * page should show its current state next to the error.
 */
export function useAdminAction(options: UseAdminActionOptions = {}) {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const invalidate = options.invalidate;

  const run = useCallback(
    async <T,>(action: () => Promise<T>): Promise<ActionResult<T> | null> => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setPending(true);
      setError(null);
      try {
        const data = await action();
        return { ok: true, data };
      } catch (raw) {
        const apiError = await toApiError(raw);
        setError(apiError);
        return { ok: false, error: apiError };
      } finally {
        inFlight.current = false;
        setPending(false);
        for (const queryKey of invalidate ?? []) {
          void queryClient.invalidateQueries({ queryKey });
        }
      }
    },
    [queryClient, invalidate],
  );

  const reset = useCallback(() => setError(null), []);

  return { run, isPending, error, reset };
}
