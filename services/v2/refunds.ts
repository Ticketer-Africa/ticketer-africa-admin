"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGet, adminPost, type QueryParams } from "./client";
import type { AdminRequest, Paged, PersonRef } from "./types";
import type { LedgerEntry, TransactionStatus, TransactionType } from "./transactions";

/* Shapes from backend src/v2/admin/refunds/admin-refunds.service.ts. */

export const refundsKey = ["v2", "refunds"] as const;

export type RefundStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type RefundMode = "KORAPAY" | "MANUAL";

export const REFUND_MODE_LABELS: Record<RefundMode, string> = {
  KORAPAY: "Korapay",
  MANUAL: "Manual",
};

/** Korapay's refund statuses and our own markers, in words. */
const PROVIDER_STATUS_LABELS: Record<string, string> = {
  initiating: "Sending to Korapay",
  processing: "Processing at Korapay",
  success: "Paid by Korapay",
  failed: "Failed at Korapay",
  not_found: "Korapay has no record of it",
};

export function providerStatusLabel(status: string | null): string | null {
  return status ? (PROVIDER_STATUS_LABELS[status] ?? status) : null;
}

/** A Refund row as stored. Money is naira. */
export interface RefundRecord {
  id: string;
  /** Korapay reference: refund_<id>, or refund_<id>_<n> on a retry. */
  reference: string;
  transactionId: string;
  /** What goes back to the buyer (the whole payment). */
  amount: number;
  /** Taken back from the organizer's wallet. */
  organizerDebit: number;
  /** Taken back from the platform wallet (its fee, plus the organizer's share if it covered it). */
  platformDebit: number;
  platformCoveredOrganizerShare: boolean;
  mode: RefundMode;
  status: RefundStatus;
  reason: string;
  /** Korapay's own status, or our markers "initiating" / "not_found". */
  providerStatus: string | null;
  failureReason: string | null;
  approvalRequestId: string | null;
  createdById: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /v2/admin/refunds item. */
export interface AdminRefundRow extends RefundRecord {
  transaction: {
    id: string;
    reference: string;
    user: PersonRef;
    event: { id: string; name: string } | null;
  } | null;
}

/** GET /v2/admin/refunds/:id */
export interface AdminRefundDetail extends RefundRecord {
  transaction: {
    id: string;
    reference: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    feeAmount: number | null;
    createdAt: string;
    user: PersonRef;
    event: { id: string; name: string; cancelledAt: string | null } | null;
  } | null;
  /** The reversals (and any restorations) this refund wrote. */
  ledger: Omit<LedgerEntry, "walletId">[];
  request: AdminRequest | null;
}

/** Filters: status, mode, from/to (YYYY-MM-DD). Sort: createdAt | updatedAt | amount. */
export function useRefunds(params: QueryParams) {
  return useQuery({
    queryKey: [...refundsKey, "list", params],
    queryFn: () => adminGet<Paged<AdminRefundRow>>("/refunds", params),
    placeholderData: keepPreviousData,
  });
}

export function useRefund(id: string | undefined) {
  return useQuery({
    queryKey: [...refundsKey, id],
    queryFn: () => adminGet<AdminRefundDetail>(`/refunds/${id}`),
    enabled: Boolean(id),
  });
}

/** Tier 1, open Korapay refunds only. Applies only an explicit success or failure. */
export const recheckRefund = (id: string) =>
  adminPost<{ refundId: string; providerStatus: string; refundStatus: RefundStatus }>(
    `/refunds/${id}/recheck`,
  );

/** Korapay won't refund less than this (naira). */
export const KORAPAY_MIN_REFUND = 100;
