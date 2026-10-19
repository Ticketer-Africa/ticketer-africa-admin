"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { lagosToday, type DateRange } from "@/lib/date-range";
import { adminGet } from "./client";

/*
 * Shapes from backend src/v2/admin/analytics/admin-analytics.service.ts.
 * `from`/`to` are Lagos days (YYYY-MM-DD, `to` inclusive); a missing `from`
 * means the 30 days ending `to`. Money is naira. Every hook keeps the
 * previous range's data on screen while the next one loads.
 */

export const analyticsKey = ["v2", "analytics"] as const;

export type Granularity = "day" | "week" | "month";

/** One period's figures (GET analytics/overview → current / previous). */
export interface Metrics {
  processed: number;
  refunded: number;
  netRevenue: number;
  orders: number;
  ticketsSold: number;
  buyers: number;
  averageOrderValue: number;
  /** 0..1, or null when no purchase settled in the range. */
  paymentSuccessRate: number | null;
  resaleVolume: number;
  resaleCount: number;
  royalties: number;
  newUsers: number;
  newOrganizers: number;
  eventsCreated: number;
  eventsHeld: number;
}

export interface Overview {
  /** UTC instants: [from, to) and the equally long period before it. */
  range: { from: string; to: string; prevFrom: string; prevTo: string };
  current: Metrics;
  previous: Metrics;
}

export interface TimeseriesPoint {
  /** First Lagos day of the bucket, YYYY-MM-DD. */
  bucket: string;
  processed: number;
  netRevenue: number;
  ticketsSold: number;
  orders: number;
  refunded: number;
}

export interface TopRow {
  id: string;
  name: string;
  processed: number;
  ticketsSold: number;
  orders: number;
}

export interface CategoryRow {
  category: string;
  processed: number;
  /** Distinct events with sales in the range. */
  events: number;
  ticketsSold: number;
}

export interface HeatmapCell {
  /** Monday = 0 … Sunday = 6, Lagos time. */
  weekday: number;
  hour: number;
  ticketsSold: number;
}

export interface Fees {
  primaryFees: number;
  resaleFees: number;
  withdrawalFees: number;
  total: number;
}

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface PayoutStats {
  /** Payouts created in the range, always all four statuses. */
  byStatus: { status: PayoutStatus; count: number; amount: number }[];
  /** PENDING + PROCESSING right now, whatever the range. */
  inFlight: number;
  /** Sum of organizer wallet balances right now. */
  walletLiabilities: number;
}

const rangeParams = (range: DateRange) => ({ from: range.from, to: range.to });

function useRangeQuery<T>(name: string, range: DateRange, extra: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: [...analyticsKey, name, range.from ?? "", range.to ?? "", extra],
    queryFn: () => adminGet<T>(`/analytics/${name}`, { ...rangeParams(range), ...extra }),
    placeholderData: keepPreviousData,
  });
}

export function useOverview(range: DateRange) {
  return useRangeQuery<Overview>("overview", range);
}

export function useTimeseries(range: DateRange, granularity: Granularity) {
  return useRangeQuery<{ points: TimeseriesPoint[] }>("timeseries", range, { granularity });
}

export function useTopEvents(range: DateRange, limit = 10) {
  return useRangeQuery<{ items: TopRow[] }>("top-events", range, { limit });
}

export function useTopOrganizers(range: DateRange, limit = 10) {
  return useRangeQuery<{ items: TopRow[] }>("top-organizers", range, { limit });
}

export function useCategories(range: DateRange) {
  return useRangeQuery<{ items: CategoryRow[] }>("categories", range);
}

export function useHeatmap(range: DateRange) {
  return useRangeQuery<{ cells: HeatmapCell[] }>("sales-heatmap", range);
}

export function useFees(range: DateRange) {
  return useRangeQuery<Fees>("fees", range);
}

export function usePayoutStats(range: DateRange) {
  return useRangeQuery<PayoutStats>("payouts", range);
}

const DAY_MS = 86_400_000;

/**
 * Days in an inclusive YYYY-MM-DD range, read the way the API does: a
 * missing `from` is 30 days, a missing `to` is today in Lagos.
 */
export function rangeDays(range: DateRange, now: Date = new Date()): number {
  if (!range.from) return 30;
  const start = Date.parse(`${range.from}T00:00:00Z`);
  const end = Date.parse(`${range.to ?? lagosToday(now)}T00:00:00Z`);
  return Math.max(1, Math.round((end - start) / DAY_MS) + 1);
}

/** Day buckets up to 45 days, weeks up to 200, then months. */
export function autoGranularity(range: DateRange, now: Date = new Date()): Granularity {
  const days = rangeDays(range, now);
  if (days <= 45) return "day";
  if (days <= 200) return "week";
  return "month";
}
