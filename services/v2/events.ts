"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGet, adminPatch, adminPost, type QueryParams } from "./client";
import type { AdminRequest, Paged, PendingRequestRef, PersonRef } from "./types";
import type { TransactionStatus, TransactionType } from "./transactions";

/* Shapes from backend src/v2/admin/events/admin-events.service.ts. */

export const eventsKey = ["v2", "events"] as const;

export type EventCategory =
  | "MUSIC"
  | "CONCERT"
  | "CONFERENCE"
  | "WORKSHOP"
  | "SPORTS"
  | "COMEDY"
  | "THEATRE"
  | "FESTIVAL"
  | "EXHIBITION"
  | "RELIGION"
  | "NETWORKING"
  | "TECH"
  | "FASHION"
  | "PARTY";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  MUSIC: "Music",
  CONCERT: "Concert",
  CONFERENCE: "Conference",
  WORKSHOP: "Workshop",
  SPORTS: "Sports",
  COMEDY: "Comedy",
  THEATRE: "Theatre",
  FESTIVAL: "Festival",
  EXHIBITION: "Exhibition",
  RELIGION: "Religion",
  NETWORKING: "Networking",
  TECH: "Tech",
  FASHION: "Fashion",
  PARTY: "Party",
};

export type EventAccessType = "PUBLIC" | "INVITE_ONLY";
export type FeeMode = "ORGANIZER" | "ATTENDEE";

export const ACCESS_LABELS: Record<EventAccessType, string> = {
  PUBLIC: "Public",
  INVITE_ONLY: "Invite only",
};

export const FEE_MODE_LABELS: Record<FeeMode, string> = {
  ORGANIZER: "Organizer absorbs the fee",
  ATTENDEE: "Buyer pays the fee",
};

/** GET /v2/admin/events item. */
export interface AdminEventRow {
  id: string;
  name: string;
  slug: string;
  date: string;
  category: EventCategory;
  isActive: boolean;
  cancelledAt: string | null;
  accessType: EventAccessType;
  createdAt: string;
  organizer: { id: string; name: string };
  ticketsSold: number;
  capacity: number;
  /** Naira: paid purchases and resales, refunded ones included. */
  processed: number;
}

export interface EventTicketCategory {
  id: string;
  name: string;
  description: string | null;
  /** Naira. */
  price: number;
  maxTickets: number;
  maxAdmissions: number | null;
  minted: number;
}

export interface EventStats {
  /** Naira. */
  avgOrderValue: number;
  peakSalesDay: string | null;
  /** Percent, 0-100. */
  conversionRate: number;
  trend: { day: string; sold: number; heightPct: number }[];
  tierBreakdown: { id: string; name: string; sold: number; capacity: number; barPct: number }[];
  ticketsSold: number;
  capacity: number;
  /** Naira. */
  processed: number;
}

export interface EventRecentTransaction {
  id: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  /** Naira. */
  amount: number;
  createdAt: string;
  user: PersonRef;
}

/** Progress of a refund-all, kept on its request's `result`. */
export interface RefundAllResult {
  transactionIds: string[];
  queued: number;
  initiated: number;
  completed: number;
  failed: { transactionId: string; reference: string; message: string }[];
  unaccounted: number;
}

/** GET /v2/admin/events/:id */
export interface AdminEventDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  venueName: string | null;
  venueAddress: string | null;
  date: string;
  doorsOpenAt: string | null;
  category: EventCategory;
  layout: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  isVirtual: boolean;
  isRecurring: boolean;
  accessType: EventAccessType;
  cancelledAt: string | null;
  cancelReason: string | null;
  feeMode: FeeMode;
  primaryFeeBps: number;
  resaleFeeBps: number;
  royaltyFeeBps: number;
  createdAt: string;
  organizer: PersonRef & { organizerVerifiedAt: string | null };
  ticketCategories: EventTicketCategory[];
  lineup: { id: string; name: string }[];
  faq: { id: string; question: string; answer: string }[];
  goodToKnow: { id: string; text: string }[];
  stats: EventStats;
  recentTransactions: EventRecentTransaction[];
  pendingRequests: PendingRequestRef[];
  latestRefundAll: (AdminRequest & { result: RefundAllResult | null }) | null;
}

/** Display status, worked out the same way as the list filter. */
export function eventStatus(event: {
  isActive: boolean;
  cancelledAt: string | null;
  date: string;
}): "CANCELLED" | "INACTIVE" | "PAST" | "UPCOMING" {
  if (event.cancelledAt) return "CANCELLED";
  if (!event.isActive) return "INACTIVE";
  return new Date(event.date).getTime() < Date.now() ? "PAST" : "UPCOMING";
}

/**
 * Filters: status (active|inactive|cancelled|past|upcoming), category,
 * organizerId, accessType, dateFrom/dateTo, q. Sort: date|createdAt|name|processed.
 */
export function useEvents(params: QueryParams) {
  return useQuery({
    queryKey: [...eventsKey, "list", params],
    queryFn: () => adminGet<Paged<AdminEventRow>>("/events", params),
    placeholderData: keepPreviousData,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: [...eventsKey, id],
    queryFn: () => adminGet<AdminEventDetail>(`/events/${id}`),
    enabled: Boolean(id),
  });
}

export interface EventContentInput {
  name?: string;
  description?: string;
  venueName?: string;
  venueAddress?: string;
  date?: string;
  category?: EventCategory;
}

/** Tier 1: content only. */
export const updateEventContent = (id: string, input: EventContentInput) =>
  adminPatch<unknown>(`/events/${id}`, input);

export interface EventFeesInput {
  primaryFeeBps: number;
  resaleFeeBps: number;
  royaltyFeeBps: number;
  feeMode: FeeMode;
  reason: string;
}

/** Tier 2. Basis points, 0-3000. */
export const updateEventFees = (id: string, input: EventFeesInput) =>
  adminPatch<unknown>(`/events/${id}/fees`, input);

/** Tier 1. */
export const toggleEvent = (id: string) => adminPost<{ id: string; isActive: boolean }>(`/events/${id}/toggle`);

/** Tier 2. Final: a cancelled event can't be put back on sale. */
export const cancelEvent = (id: string, reason: string) =>
  adminPost<unknown>(`/events/${id}/cancel`, { reason });

/** Basis points as a percent string: 350 → "3.5%". */
export function bpsToPercent(bps: number): string {
  return `${Number((bps / 100).toFixed(2))}%`;
}
