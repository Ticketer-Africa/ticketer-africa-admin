"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { focusPageHeading } from "@/lib/focus-return";
import { ApiError, toApiError } from "@/services/v2/client";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

interface UseAdminActionOptions {
  /** Queries to refetch after the action, whether it worked or not. */
  invalidate?: QueryKey[];
}

/**
 * Runs one admin mutation at a time. A second call while the first is in
 * flight is ignored (a ref, not state, so even two clicks in the same frame
 * send one request).
 *
 * After a success it stays locked (`isDone`) until `reset()`: the sheet or
 * popover is still sliding away and its confirm button still on screen, and
 * a click there must not send the action again (a second approval request,
 * a second email). Call `reset()` once the surface has fully closed, or
 * when it is opened afresh. A failure unlocks straight away so the person
 * can fix the input and retry.
 *
 * It refetches `invalidate` on success *and* on failure: a 400/409 usually
 * means the record changed under us, and the page should show its current
 * state next to the error.
 */
export function useAdminAction(options: UseAdminActionOptions = {}) {
  const queryClient = useQueryClient();
  const locked = useRef(false);
  const [isPending, setPending] = useState(false);
  const [isDone, setDone] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const invalidate = options.invalidate;

  const run = useCallback(
    async <T,>(action: () => Promise<T>): Promise<ActionResult<T> | null> => {
      if (locked.current) return null;
      locked.current = true;
      setPending(true);
      setError(null);
      let succeeded = false;
      try {
        const data = await action();
        succeeded = true;
        setDone(true);
        return { ok: true, data };
      } catch (raw) {
        const apiError = await toApiError(raw);
        setError(apiError);
        return { ok: false, error: apiError };
      } finally {
        // Stay locked after a success until reset().
        if (!succeeded) locked.current = false;
        setPending(false);
        for (const queryKey of invalidate ?? []) {
          void queryClient.invalidateQueries({ queryKey });
        }
      }
    },
    [queryClient, invalidate],
  );

  /** Unlock and clear the error and the done state. */
  const reset = useCallback(() => {
    locked.current = false;
    setDone(false);
    setError(null);
  }, []);

  return { run, isPending, isDone, error, reset };
}

/**
 * When an action's trigger disappears (the action stopped applying after a
 * refetch) while it had focus, focus would fall to <body>. Move it to the
 * page heading instead.
 */
export function useKeepFocusWhenHidden(
  available: boolean,
  triggerRef: RefObject<HTMLElement | null>,
) {
  const wasAvailable = useRef(available);
  const lastTrigger = useRef<HTMLElement | null>(null);

  // Remember the trigger node while it exists; the ref is nulled on unmount.
  useEffect(() => {
    if (triggerRef.current) lastTrigger.current = triggerRef.current;
  });

  useEffect(() => {
    const was = wasAvailable.current;
    wasAvailable.current = available;
    if (!was || available) return;
    const trigger = lastTrigger.current;
    const focusLost =
      !document.activeElement || document.activeElement === document.body;
    if (trigger && !trigger.isConnected && focusLost) focusPageHeading();
  }, [available]);
}
