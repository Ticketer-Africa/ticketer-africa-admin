"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "./client";
import type { Paged } from "./types";

/* Shapes from backend src/v2/admin/transactions/admin-transactions.service.ts. */

export const transactionsKey = ["v2", "transactions"] as const;

export type TransactionType = "PURCHASE" | "RESALE" | "WITHDRAW" | "FUND";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

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
