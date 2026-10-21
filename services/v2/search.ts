"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGet } from "./client";

/* Shape from backend src/v2/admin/search/admin-search.service.ts. */

export interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  /** Admin console path, e.g. /transactions/:id. */
  href: string;
}

export type SearchGroup = "users" | "organizers" | "events" | "transactions" | "tickets" | "payouts";

export type SearchResults = Record<SearchGroup, SearchHit[]>;

export const SEARCH_GROUP_LABELS: Record<SearchGroup, string> = {
  transactions: "Payments",
  tickets: "Tickets",
  users: "People",
  organizers: "Organizers",
  events: "Events",
  payouts: "Payouts",
};

/** Exact references, ticket codes and emails come first in each group. */
export function useGlobalSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: ["v2", "search", "all", term],
    queryFn: () => adminGet<SearchResults>("/search", { q: term }),
    enabled: term.length >= 2,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

const RECENT_KEY = "ticketer-admin:recent-records";
const RECENT_MAX = 6;

/** Records opened from search, newest first. Browser-only and best effort. */
export function readRecent(): SearchHit[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as SearchHit[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function rememberRecent(hit: SearchHit): void {
  try {
    const next = [hit, ...readRecent().filter((r) => r.href !== hit.href)].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: recent records just aren't kept.
  }
}
