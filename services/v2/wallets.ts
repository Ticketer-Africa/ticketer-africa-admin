"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGet, type QueryParams } from "./client";
import type { Paged, Role } from "./types";
import type { LedgerEntryType } from "./transactions";

/* Shapes from backend src/v2/admin/wallets/admin-wallets.service.ts. */

export const walletsKey = ["v2", "wallets"] as const;

/** GET /v2/admin/wallets item; the platform's own wallet always comes first. */
export interface AdminWalletRow {
  userId: string;
  name: string;
  email: string;
  role: Role;
  /** Naira. */
  balance: number;
  isPlatform: boolean;
  lastEntryAt: string | null;
}

export interface WalletMismatch {
  userId: string;
  name: string;
  email: string;
  /** Naira. */
  balance: number;
  ledgerSum: number;
  difference: number;
}

export type LedgerLinkKind = "transaction" | "payout" | "refund" | "request" | "event";

export interface WalletLedgerRow {
  id: string;
  type: LedgerEntryType;
  /** Naira, signed: credits positive, debits negative. */
  amount: number;
  balanceAfter: number;
  reference: string;
  createdAt: string;
  link: { kind: LedgerLinkKind; id: string } | null;
}

/** Filters: q, minBalance (naira), mismatch=1. Sort: balance|lastEntryAt. */
export function useWallets(params: QueryParams) {
  return useQuery({
    queryKey: [...walletsKey, "list", params],
    queryFn: () => adminGet<Paged<AdminWalletRow>>("/wallets", params),
    placeholderData: keepPreviousData,
  });
}

export function useWalletMismatches() {
  return useQuery({
    queryKey: [...walletsKey, "mismatches"],
    queryFn: () => adminGet<{ items: WalletMismatch[]; total: number }>("/wallets/mismatches"),
    staleTime: 60_000,
  });
}

/** Filters: type, from, to. */
export function useWalletLedger(userId: string | undefined, params: QueryParams) {
  return useQuery({
    queryKey: [...walletsKey, userId, "ledger", params],
    queryFn: () => adminGet<Paged<WalletLedgerRow>>(`/wallets/${userId}/ledger`, params),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}
