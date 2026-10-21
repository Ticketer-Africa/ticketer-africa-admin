"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminGet, adminPost, ApiError, toApiError } from "./client";
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

/** What a tier 3 submit produced. */
export interface RequestOutcome {
  /** The created request; after a self-approval, its state after running. */
  request: Pick<PendingRequestRef, "id" | "status"> & Partial<AdminRequest>;
  /** True when the requester approved it themselves and it was run. */
  selfApproved: boolean;
  /** The request exists but approving it yourself failed (it stays PENDING). */
  selfApproveError?: string;
}

/**
 * Tier 3 submit. Creates the request; when `selfApprove` is set (a
 * SUPERADMIN ticked "Approve my own request", reason ≥ 20 characters) it
 * then approves it with POST /requests/:id/approve { selfApprove, reason },
 * which runs it at once and emails the other superadmins.
 *
 * If the approval fails after the request was created, it resolves (not
 * rejects) with `selfApproveError`: the request exists and is waiting, and
 * submitting again would create a second one.
 */
export async function createAndMaybeSelfApprove(
  input: CreateRequestInput,
  { selfApprove }: { selfApprove: boolean },
): Promise<RequestOutcome> {
  const created = await createAdminRequest(input);
  if (!selfApprove) return { request: created, selfApproved: false };
  try {
    const approved = await adminPost<AdminRequest>(`/requests/${created.id}/approve`, {
      selfApprove: true,
      reason: input.reason,
    });
    return { request: approved, selfApproved: true };
  } catch (error) {
    return {
      request: created,
      selfApproved: false,
      selfApproveError: (await toApiError(error)).message,
    };
  }
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

/**
 * Filters: status, type, targetType, targetId, requestedById ("Mine"),
 * decided ("true": anything not PENDING). Newest first.
 */
export function useRequests(
  params: Record<string, string | number | undefined>,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [...requestsKey, "list", params],
    queryFn: () => adminGet<Paged<AdminRequest>>("/requests", params),
    enabled,
  });
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: [...requestsKey, id],
    queryFn: () => adminGet<AdminRequest>(`/requests/${id}`),
    enabled: Boolean(id),
  });
}

/** SUPERADMIN only. `selfApprove` (with a 20+ character reason) for your own request. */
/**
 * Approve and retry answer 200 even when the action then failed to run; the
 * request comes back FAILED. Turn that into an error so the sheet shows it
 * instead of a success toast.
 */
function ranOrThrow(request: AdminRequest): AdminRequest {
  if (request.status === "FAILED") {
    throw new ApiError(
      200,
      `It was approved but didn't run: ${request.failureReason ?? "no reason given"}. You can retry it from this page.`,
      "RUN_FAILED",
    );
  }
  return request;
}

export const approveRequest = (id: string, body: { reason?: string; selfApprove?: boolean }) =>
  adminPost<AdminRequest>(`/requests/${id}/approve`, body).then(ranOrThrow);

/** SUPERADMIN only; reason ≥ 10 characters. */
export const rejectRequest = (id: string, reason: string) =>
  adminPost<AdminRequest>(`/requests/${id}/reject`, { reason });

/** The requester, while it's still PENDING. */
export const cancelRequest = (id: string) => adminPost<AdminRequest>(`/requests/${id}/cancel`);

/** SUPERADMIN; from FAILED, or APPROVED that stalled for 10+ minutes. */
export const retryRequest = (id: string) =>
  adminPost<AdminRequest>(`/requests/${id}/retry`).then(ranOrThrow);
