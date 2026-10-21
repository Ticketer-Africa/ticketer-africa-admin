"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGet, adminPost, type QueryParams } from "./client";
import type { Paged, PendingRequestRef, PersonRef } from "./types";
import type { RefundRecord } from "./refunds";

/* Shapes from backend src/v2/admin/transactions/admin-transactions.service.ts. */

export const transactionsKey = ["v2", "transactions"] as const;

export type TransactionType = "PURCHASE" | "RESALE" | "WITHDRAW" | "FUND";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  PURCHASE: "Purchase",
  RESALE: "Resale",
  WITHDRAW: "Withdrawal",
  FUND: "Wallet top-up",
};

/** GET /v2/admin/transactions item. */
export interface AdminTransactionRow {
  id: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  /** Naira the buyer paid. */
  amount: number;
  feeAmount: number | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  event: { id: string; name: string } | null;
  ticketCount: number;
}

export type LedgerEntryType =
  | "OPENING_BALANCE"
  | "PURCHASE_PROCEEDS"
  | "RESALE_ROYALTY"
  | "PLATFORM_FEE"
  | "EVENT_PAYOUT_RELEASE"
  | "WITHDRAWAL_HOLD"
  | "WITHDRAWAL_REFUND"
  | "ADJUSTMENT"
  | "REFUND_REVERSAL"
  | "REFUND_REVERSAL_RESTORED";

/** A wallet ledger line, with the wallet's owner. Signed naira: + credit, - debit. */
export interface LedgerEntry {
  id: string;
  walletId?: string;
  type: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  reference: string;
  createdAt: string;
  owner: PersonRef;
}

/** GET /v2/admin/transactions/:id */
export interface AdminTransactionDetail {
  id: string;
  reference: string;
  userId: string;
  eventId: string | null;
  type: TransactionType;
  status: TransactionStatus;
  /** Final naira charged, after discounts, fees included. */
  amount: number;
  /** Ticket price before the discount; null on older purchases. */
  baseAmount: number | null;
  discountAmount: number | null;
  /** Fees the buyer paid on top of the ticket price; null when not recorded. */
  feeAmount: number | null;
  discountCodeId: string | null;
  createdAt: string;
  updatedAt: string;
  user: PersonRef;
  event: { id: string; name: string; date: string; slug: string } | null;
  /** `value` is left out on purpose: the API's unit for it is ambiguous. */
  discountCode: { id: string; code: string; type: "PERCENT" | "FLAT" } | null;
  tickets: {
    id: string;
    code: string;
    isUsed: boolean;
    isListed: boolean;
    voidedAt: string | null;
    recipientName: string | null;
    recipientEmail: string | null;
    ticketCategory: { id: string; name: string } | null;
  }[];
  /** Entries keyed by this transaction's reference (the sale's credits). */
  ledger: LedgerEntry[];
  refund: RefundRecord | null;
  pendingRequests: PendingRequestRef[];
}

/**
 * Filters: status, type, eventId, userId, from/to (YYYY-MM-DD Lagos days or
 * ISO datetimes), minAmount/maxAmount (naira), q (reference or buyer email).
 * Sort: createdAt | amount.
 */
export function useTransactions(params: QueryParams) {
  return useQuery({
    queryKey: [...transactionsKey, "list", params],
    queryFn: () => adminGet<Paged<AdminTransactionRow>>("/transactions", params),
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: [...transactionsKey, id],
    queryFn: () => adminGet<AdminTransactionDetail>(`/transactions/${id}`),
    enabled: Boolean(id),
  });
}

/** The newest transactions of any kind, for the overview. */
export function useRecentTransactions(limit = 8) {
  return useQuery({
    queryKey: [...transactionsKey, "recent", limit],
    queryFn: () =>
      adminGet<Paged<AdminTransactionRow>>("/transactions", {
        sort: "createdAt",
        order: "desc",
        pageSize: limit,
      }),
    refetchInterval: 60_000,
  });
}

// ─── Actions ───

/** Tier 1, PENDING only. "success": confirmed and paid; "pending": nothing changed. */
export const recheckTransaction = (id: string) =>
  adminPost<{ outcome: "success" | "pending" }>(`/transactions/${id}/recheck`);

/** Tier 2, PENDING only; Korapay must say the charge failed. */
export const markTransactionFailed = (id: string, reason: string) =>
  adminPost<{ id: string; status: "FAILED" }>(`/transactions/${id}/mark-failed`, { reason });

/**
 * Tier 2, FAILED purchases only. "not-successful" means Korapay doesn't
 * report it as paid and nothing changed. `warning` lists side effects that
 * may have been skipped.
 */
export const recoverTransaction = (id: string, reason: string) =>
  adminPost<{ outcome: "recovered" | "not-successful"; warning?: string }>(
    `/transactions/${id}/recover`,
    { reason },
  );

/** Tier 1, SUCCESS purchases only: the buyer's email, optionally each recipient's. */
export const resendTickets = (id: string, includeRecipients: boolean) =>
  adminPost<{ sentTo: string; ticketCount: number; recipientEmailsSent: number }>(
    `/transactions/${id}/resend-tickets`,
    { includeRecipients },
  );

// ─── Event filter ───

interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/**
 * Events for the list's event filter, from GET /search (5 at most, exact
 * id or slug first). Needs 2+ characters. Passing an event id finds that
 * event, which is how the filter shows the name of an event from the URL.
 */
export function useEventOptions(q: string) {
  return useSearchOptions("events", q);
}

/** One group of the global search (2+ characters), for pickers and filters. */
export function useSearchOptions(group: "events" | "organizers", q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: ["v2", "search", group, term],
    queryFn: () =>
      adminGet<Record<typeof group, SearchHit[]>>("/search", { q: term }).then((r) => r[group]),
    enabled: term.length >= 2,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
