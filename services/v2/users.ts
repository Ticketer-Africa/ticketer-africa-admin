"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGet, adminPost, type QueryParams } from "./client";
import type { Paged, PendingRequestRef, Role } from "./types";

/* Shapes from backend src/v2/admin/users/admin-users.service.ts. */

export const usersKey = ["v2", "users"] as const;

/** GET /v2/admin/users item. */
export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  suspendedAt: string | null;
  organizerVerifiedAt: string | null;
  createdAt: string;
  /** Events this user organizes. */
  eventsCount: number;
  /** Naira: successful purchases and resales. */
  totalSpent: number;
}

/** GET /v2/admin/users/:id */
export interface AdminUserDetail extends AdminUserRow {
  suspendedReason: string | null;
  updatedAt: string;
  wallet: {
    id: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  tickets: {
    id: string;
    code: string;
    isUsed: boolean;
    isListed: boolean;
    voidedAt: string | null;
    createdAt: string;
    event: { id: string; name: string; date: string } | null;
  }[];
  transactions: {
    id: string;
    reference: string;
    type: "PURCHASE" | "RESALE" | "WITHDRAW" | "FUND";
    status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
    amount: number;
    eventId: string | null;
    createdAt: string;
  }[];
  pendingRequests: PendingRequestRef[];
}

/** Filters: role, verified, suspended ("true"/"false"), joinedFrom/To, q. */
export function useUsers(params: QueryParams) {
  return useQuery({
    queryKey: [...usersKey, "list", params],
    queryFn: () => adminGet<Paged<AdminUserRow>>("/users", params),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: [...usersKey, id],
    queryFn: () => adminGet<AdminUserDetail>(`/users/${id}`),
    enabled: Boolean(id),
  });
}

export const suspendUser = (id: string, reason: string) =>
  adminPost<{ id: string; suspendedAt: string }>(`/users/${id}/suspend`, { reason });

export const unsuspendUser = (id: string, reason: string) =>
  adminPost<{ id: string; suspendedAt: null }>(`/users/${id}/unsuspend`, { reason });

/** Tier 1: only for accounts that haven't verified their email yet. */
export const resendSignupCode = (id: string) => adminPost<unknown>(`/users/${id}/resend-otp`);
