"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGet, adminPatch, adminPost, type QueryParams } from "./client";
import type { Paged } from "./types";

/* Shapes from backend src/v2/admin/discounts/admin-discounts.service.ts. */

export const discountsKey = ["v2", "discounts"] as const;

export type DiscountType = "PERCENT" | "FLAT";

/**
 * GET /v2/admin/discounts item. A PERCENT code carries `valuePercent`
 * (1-100); a FLAT code carries `valueAmount` in naira.
 */
export interface AdminDiscountRow {
  id: string;
  code: string;
  type: DiscountType;
  valuePercent?: number;
  valueAmount?: number;
  /** Null: unlimited. */
  usageLimit: number | null;
  usedCount: number;
  /** Set when the code is switched off. */
  disabledAt: string | null;
  createdAt: string;
  event: { id: string; name: string };
}

export const DISCOUNT_LIMIT_MAX = 100_000;

/** Filters: eventId, active ("true" | "false"), q (code). Sort: createdAt | usedCount. */
export function useDiscounts(params: QueryParams) {
  return useQuery({
    queryKey: [...discountsKey, "list", params],
    queryFn: () => adminGet<Paged<AdminDiscountRow>>("/discounts", params),
    placeholderData: keepPreviousData,
  });
}

export interface CreateDiscountInput {
  eventId: string;
  code: string;
  type: DiscountType;
  /** PERCENT: a whole number 1-100. FLAT: naira. */
  value: number;
  usageLimit?: number;
}

/** Tier 1. */
export const createDiscount = (input: CreateDiscountInput) =>
  adminPost<AdminDiscountRow>("/discounts", input);

/** Tier 1. `null` removes the limit; it can't go below the times already used. */
export const updateDiscountLimit = (id: string, usageLimit: number | null) =>
  adminPatch<AdminDiscountRow>(`/discounts/${id}`, { usageLimit });

/** Tier 1. */
export const disableDiscount = (id: string) =>
  adminPost<AdminDiscountRow>(`/discounts/${id}/disable`);

/** Tier 1. */
export const enableDiscount = (id: string) =>
  adminPost<AdminDiscountRow>(`/discounts/${id}/enable`);
