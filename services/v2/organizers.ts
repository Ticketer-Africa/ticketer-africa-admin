"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGet, adminPost, type QueryParams } from "./client";
import type { Paged, Role } from "./types";
import type { LedgerEntryType } from "./transactions";

/* Shapes from backend src/v2/admin/organizers/admin-organizers.service.ts. */

export const organizersKey = ["v2", "organizers"] as const;

/** GET /v2/admin/organizers item. */
export interface AdminOrganizerRow {
  id: string;
  name: string;
  email: string;
  organizerVerifiedAt: string | null;
  suspendedAt: string | null;
  createdAt: string;
  /** Naira. */
  balance: number;
  eventsCount: number;
  /** Naira: paid sales across their events, refunded ones included. */
  processed: number;
}

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type DestinationStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DEACTIVATED";

/** GET /v2/admin/organizers/:id */
export interface AdminOrganizerDetail {
  id: string;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  profileImage: string | null;
  organizerVerifiedAt: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
  wallet: { id: string; balance: number; createdAt: string; updatedAt: string } | null;
  totals: {
    /** Naira. */
    processed: number;
    /** Naira: what Ticketer Africa kept from their successful sales. */
    platformProfit: number;
  };
  events: {
    id: string;
    name: string;
    date: string;
    isActive: boolean;
    cancelledAt: string | null;
    ticketsSold: number;
    capacity: number;
  }[];
  ledger: {
    id: string;
    type: LedgerEntryType;
    /** Naira, signed. */
    amount: number;
    balanceAfter: number;
    reference: string;
    createdAt: string;
  }[];
  payoutDestinations: {
    id: string;
    provider: "KORA" | "BACHS";
    label: string;
    bankName: string | null;
    last4: string;
    resolvedAccountName: string | null;
    status: DestinationStatus;
    statusReason: string | null;
    isUsable: boolean;
    isDefault: boolean;
    createdAt: string;
  }[];
  recentPayouts: {
    id: string;
    reference: string;
    /** Naira. */
    amount: number;
    status: PayoutStatus;
    provider: "KORA" | "BACHS";
    walletBacked: boolean;
    failureReason: string | null;
    createdAt: string;
    completedAt: string | null;
  }[];
}

/** Filters: verified, hasBalance ("true" | "false"), q. Sort: createdAt|name|balance|processed. */
export function useOrganizers(params: QueryParams) {
  return useQuery({
    queryKey: [...organizersKey, "list", params],
    queryFn: () => adminGet<Paged<AdminOrganizerRow>>("/organizers", params),
    placeholderData: keepPreviousData,
  });
}

export function useOrganizer(id: string | undefined) {
  return useQuery({
    queryKey: [...organizersKey, id],
    queryFn: () => adminGet<AdminOrganizerDetail>(`/organizers/${id}`),
    enabled: Boolean(id),
  });
}

/** Tier 2. */
export const verifyOrganizer = (id: string, reason: string) =>
  adminPost<unknown>(`/organizers/${id}/verify`, { reason });

/** Tier 2. */
export const unverifyOrganizer = (id: string, reason: string) =>
  adminPost<unknown>(`/organizers/${id}/unverify`, { reason });
