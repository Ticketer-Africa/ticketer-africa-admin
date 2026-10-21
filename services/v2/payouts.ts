"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGet, adminPost, type QueryParams } from "./client";
import type { AuditEntry, Paged, PendingRequestRef, PersonRef } from "./types";
import type { DestinationStatus, PayoutStatus } from "./organizers";

/* Shapes from backend src/v2/admin/payouts/admin-payouts.service.ts. */

export const payoutsKey = ["v2", "payouts"] as const;

export type PayoutProvider = "KORA" | "BACHS";

export const PROVIDER_LABELS: Record<PayoutProvider, string> = {
  KORA: "Korapay",
  BACHS: "Bachs",
};

/** GET /v2/admin/payouts item. Only the bank name and last 4 digits ever come back. */
export interface AdminPayoutRow {
  id: string;
  reference: string;
  status: PayoutStatus;
  /** Naira: what the recipient gets. */
  amount: number;
  /** Naira kept back from a withdrawal for transfer charges. */
  withdrawalFee: number;
  totalDebited: number | null;
  /** True for a wallet withdrawal; false for a settlement (e.g. a resale seller). */
  walletBacked: boolean;
  provider: PayoutProvider;
  failureReason: string | null;
  createdAt: string;
  dispatchedAt: string | null;
  completedAt: string | null;
  user: PersonRef;
  destination: { bankName: string | null; accountLast4: string | null };
}

export interface PayoutHistoryEntry {
  id: string;
  actorId: string | null;
  actorType: "USER" | "ADMIN" | "SYSTEM";
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/** GET /v2/admin/payouts/:id */
export interface AdminPayoutDetail extends AdminPayoutRow {
  providerPayoutId: string | null;
  /** Naira charged by the provider, when recorded. */
  fee: number | null;
  history: PayoutHistoryEntry[];
  pendingRequests: PendingRequestRef[];
}

export interface PauseState {
  paused: boolean;
  /** "admin": paused by a person until resumed; "automatic": a provider error, with a timer. */
  source: "admin" | "automatic" | null;
  ttlSeconds: number | null;
  lastChange: AuditEntry | null;
}

/** Filters: status, walletBacked, provider, userId, from/to, q. Sort: createdAt|amount. */
export function usePayouts(params: QueryParams) {
  return useQuery({
    queryKey: [...payoutsKey, "list", params],
    queryFn: () => adminGet<Paged<AdminPayoutRow>>("/payouts", params),
    placeholderData: keepPreviousData,
  });
}

export function usePayout(id: string | undefined) {
  return useQuery({
    queryKey: [...payoutsKey, id],
    queryFn: () => adminGet<AdminPayoutDetail>(`/payouts/${id}`),
    enabled: Boolean(id),
  });
}

export function usePauseState() {
  return useQuery({
    queryKey: [...payoutsKey, "pause"],
    queryFn: () => adminGet<PauseState>("/payouts/pause"),
    refetchInterval: 60_000,
  });
}

/** Tier 1: the emergency brake. Resuming needs a second person. */
export const pausePayouts = (reason?: string) =>
  adminPost<PauseState>("/payouts/pause", reason ? { reason } : {});

/** Tier 1. */
export const recheckPayout = (id: string) =>
  adminPost<{ id: string; previousStatus: PayoutStatus; status: PayoutStatus }>(`/payouts/${id}/recheck`);

/** Eligible for a force-fail request: in flight for over an hour. */
export function canForceFail(payout: Pick<AdminPayoutRow, "status" | "createdAt">): boolean {
  return (
    (payout.status === "PENDING" || payout.status === "PROCESSING") &&
    Date.now() - new Date(payout.createdAt).getTime() > 60 * 60 * 1000
  );
}

export interface AdminDestination {
  id: string;
  userId: string;
  provider: PayoutProvider;
  label: string;
  bankName: string | null;
  last4: string;
  resolvedAccountName: string | null;
  status: DestinationStatus;
  statusReason: string | null;
  isUsable: boolean;
  isDefault?: boolean;
  /** A queued account-details change waiting for a second approval. */
  pendingRouting?: unknown;
  reviewedAt?: string | null;
  createdAt: string;
  user?: PersonRef;
}

export function useDestinations(status: DestinationStatus | undefined) {
  return useQuery({
    queryKey: [...payoutsKey, "destinations", status ?? "PENDING_REVIEW"],
    queryFn: () =>
      adminGet<{ items: AdminDestination[]; total: number }>(
        "/payouts/destinations",
        status ? { status } : {},
      ),
  });
}

/** Tier 2. */
export const approveRouting = (id: string, reason: string) =>
  adminPost<AdminDestination>(`/payouts/destinations/${id}/approve-routing`, { reason });

/** Tier 2. */
export const rejectDestination = (id: string, reason: string) =>
  adminPost<AdminDestination>(`/payouts/destinations/${id}/reject`, { reason });

/** Tier 1. */
export const refreshDestination = (id: string) =>
  adminPost<AdminDestination>(`/payouts/destinations/${id}/refresh`);
