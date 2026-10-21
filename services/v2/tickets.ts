"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import Axios from "@/services/axios";
import type { TicketVerifyResult } from "@/types/tickets.type";
import { adminGet, adminPost, type QueryParams } from "./client";
import type { Paged, PendingRequestRef, PersonRef } from "./types";
import type { TransactionStatus, TransactionType } from "./transactions";

/* Shapes from backend src/v2/admin/tickets/admin-tickets.service.ts. */

export const ticketsKey = ["v2", "tickets"] as const;

/** GET /v2/admin/tickets item. */
export interface AdminTicketRow {
  id: string;
  code: string;
  isUsed: boolean;
  isListed: boolean;
  voidedAt: string | null;
  event: { id: string; name: string };
  /** Naira. */
  category: { id: string; name: string; price: number } | null;
  /** Who holds the ticket. */
  owner: PersonRef;
  /** Set when the ticket was bought for someone else. */
  recipientEmail: string | null;
  createdAt: string;
}

export interface TicketScan {
  id: string;
  scannedAt: string;
  scanner: PersonRef | null;
}

export interface TicketTransaction {
  id: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  /** Naira. */
  amount: number;
  createdAt: string;
  user: PersonRef;
}

/** GET /v2/admin/tickets/:id */
export interface AdminTicketDetail {
  id: string;
  code: string;
  isUsed: boolean;
  isListed: boolean;
  voidedAt: string | null;
  /** "refunded" when a refund voided it. */
  voidReason: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  virtualLinkSentAt: string | null;
  createdAt: string;
  event: { id: string; name: string; date: string };
  category: { id: string; name: string; price: number } | null;
  occurrence: { id: string; startsAt: string; endsAt: string | null } | null;
  owner: PersonRef;
  scans: TicketScan[];
  transactions: TicketTransaction[];
  resale: {
    isListed: boolean;
    /** Naira. */
    resalePrice: number | null;
    listedAt: string | null;
    resaleCount: number;
    resaleCommission: number | null;
    /** The buyer of a sold-on ticket. */
    soldTo: { id: string; name: string | null; email: string | null } | null;
  };
  pendingRequests: PendingRequestRef[];
}

/** Filters: eventId, used, voided, listed ("true" | "false"), q (exact code or email). */
export function useTickets(params: QueryParams) {
  return useQuery({
    queryKey: [...ticketsKey, "list", params],
    queryFn: () => adminGet<Paged<AdminTicketRow>>("/tickets", params),
    placeholderData: keepPreviousData,
  });
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: [...ticketsKey, id],
    queryFn: () => adminGet<AdminTicketDetail>(`/tickets/${id}`),
    enabled: Boolean(id),
  });
}

/**
 * Tier 1, checked-in tickets only. `cacheCleared: false` means the undo is
 * saved but the scanner's cached copy may still say "used" for a while.
 */
export const undoCheckin = (id: string) =>
  adminPost<{ id: string; isUsed: false; scansRemoved: number; cacheCleared: boolean }>(
    `/tickets/${id}/undo-checkin`,
  );

/**
 * Check a ticket at the gate. This is the shared check-in endpoint (not the
 * admin API): the first valid scan marks the ticket used.
 */
export function useVerifyTicket() {
  return useMutation({
    mutationFn: async (payload: { ticketId?: string; code?: string; eventId: string }) => {
      const res = await Axios.post<TicketVerifyResult>("/v1/tickets/verify", payload);
      return res.data;
    },
  });
}
