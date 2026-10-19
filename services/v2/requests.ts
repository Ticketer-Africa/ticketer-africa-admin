"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminGet, adminPost } from "./client";
import type {
  AdminRequest,
  AdminTargetType,
  CreateRequestInput,
  Paged,
  PendingRequestRef,
} from "./types";

export const requestsKey = ["v2", "requests"] as const;
export const pendingCountKey = [...requestsKey, "pending-count"] as const;

/** POST /requests: ask a SUPERADMIN to approve a tier 3 action. */
export function createAdminRequest(input: CreateRequestInput) {
  return adminPost<PendingRequestRef>("/requests", input);
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminRequest,
    onSettled: () => queryClient.invalidateQueries({ queryKey: requestsKey }),
  });
}

/** Requests waiting for a decision (nav badge). Refreshes every minute. */
export function usePendingCount() {
  return useQuery({
    queryKey: pendingCountKey,
    queryFn: () => adminGet<{ count: number }>("/requests/pending-count"),
    select: (data) => data.count,
    refetchInterval: 60_000,
  });
}

/** Pending requests about one record, with who asked (record banners). */
export function usePendingRequestsFor(
  targetType: AdminTargetType,
  targetId: string | undefined,
) {
  const params = { status: "PENDING", targetType, targetId, pageSize: 10 };
  return useQuery({
    queryKey: [...requestsKey, "for", targetType, targetId],
    queryFn: () => adminGet<Paged<AdminRequest>>("/requests", params),
    select: (data) => data.items,
    enabled: Boolean(targetId),
  });
}
