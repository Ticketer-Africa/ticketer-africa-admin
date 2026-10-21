"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "./client";

/* Shape from backend src/v2/admin/health/admin-health.service.ts. */

export const healthKey = ["v2", "health"] as const;

export type HealthSeverity = "critical" | "warning" | "info";

export interface HealthItem {
  /** e.g. "payouts-failed", "korapay-low". */
  key: string;
  severity: HealthSeverity;
  count: number;
  /** Naira involved, when the item is about money. */
  amount?: number;
  /** Admin path of the filtered list that shows the records. */
  href: string;
  /** A sentence for people; money in it is already "₦…". */
  label: string;
}

export interface Health {
  /** Most severe first; empty when nothing needs attention. */
  items: HealthItem[];
  /** Korapay NGN balance; both null when Korapay couldn't be reached. */
  korapay: { available: number | null; pending: number | null };
  /** What organizers are owed: the sum of their wallet balances. */
  liabilities: number;
}

/** GET /v2/admin/health, refreshed every minute. */
export function useHealth() {
  return useQuery({
    queryKey: healthKey,
    queryFn: () => adminGet<Health>("/health"),
    refetchInterval: 60_000,
  });
}
