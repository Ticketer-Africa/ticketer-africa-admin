"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/*
 * List state (filters, sort, page) lives in the URL so a pasted link opens
 * the same view. The flat params object doubles as the API query: filter
 * keys are named exactly like the backend's query parameters, and every
 * value is a string ("true"/"false" for booleans, YYYY-MM-DD for dates).
 *
 * Only values that differ from the defaults are written, in a fixed order.
 * A filter whose default is a value (Approvals' status=PENDING) is set to
 * "any" by writing `key=all`; "all" is never sent to the API.
 */

export type SortOrder = "asc" | "desc";
export type FilterValues = Record<string, string | undefined>;

export interface ListDefaults<F extends FilterValues> {
  /** Every filter key this list understands, with its default (usually undefined). */
  filters: F;
  sort: string;
  order: SortOrder;
  pageSize?: number;
}

export type ListParams<F extends FilterValues> = F & {
  sort: string;
  order: SortOrder;
  page: number;
  pageSize: number;
};

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
const RESERVED = ["sort", "order", "page", "pageSize"] as const;
/** URL marker for "no filter" on a filter whose default is a value. */
export const ANY_VALUE = "all";

/** Types the defaults so every filter key accepts a string. */
export function defineListDefaults<K extends string>(defaults: {
  filters: Record<K, string | undefined>;
  sort: string;
  order: SortOrder;
  pageSize?: number;
}): ListDefaults<Record<K, string | undefined>> {
  return defaults;
}

function positiveInt(raw: string | null, fallback: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

function clean(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function listParamsFromSearch<F extends FilterValues>(
  search: URLSearchParams,
  defaults: ListDefaults<F>,
): ListParams<F> {
  const filters = {} as FilterValues;
  for (const key of Object.keys(defaults.filters)) {
    const raw = clean(search.get(key));
    filters[key] = raw === ANY_VALUE ? undefined : (raw ?? defaults.filters[key]);
  }
  const order = search.get("order");
  return {
    ...(filters as F),
    sort: clean(search.get("sort")) ?? defaults.sort,
    order: order === "asc" || order === "desc" ? order : defaults.order,
    page: positiveInt(search.get("page"), 1),
    pageSize: Math.min(
      positiveInt(search.get("pageSize"), defaults.pageSize ?? DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    ),
  };
}

export function listParamsToSearch<F extends FilterValues>(
  params: ListParams<F>,
  defaults: ListDefaults<F>,
): string {
  const search = new URLSearchParams();
  for (const key of Object.keys(defaults.filters)) {
    const value = clean(params[key]);
    const fallback = defaults.filters[key];
    if (value === undefined) {
      if (fallback !== undefined) search.set(key, ANY_VALUE);
    } else if (value !== fallback) {
      search.set(key, value);
    }
  }
  if (params.sort !== defaults.sort) search.set("sort", params.sort);
  if (params.order !== defaults.order) search.set("order", params.order);
  if (params.page > 1) search.set("page", String(params.page));
  if (params.pageSize !== (defaults.pageSize ?? DEFAULT_PAGE_SIZE)) {
    search.set("pageSize", String(params.pageSize));
  }
  return search.toString();
}

/** Set (or clear, with "" / undefined) some filters; always back to page 1. */
export function withFilter<F extends FilterValues>(
  params: ListParams<F>,
  changes: Partial<Record<keyof F, string | undefined>>,
): ListParams<F> {
  const next: FilterValues = { ...params };
  for (const [key, value] of Object.entries(changes)) {
    if ((RESERVED as readonly string[]).includes(key)) continue;
    next[key] = clean(value as string | undefined);
  }
  return { ...(next as ListParams<F>), page: 1 };
}

export function withSort<F extends FilterValues>(
  params: ListParams<F>,
  sort: string,
  order: SortOrder,
): ListParams<F> {
  return { ...params, sort, order, page: 1 };
}

export function withPage<F extends FilterValues>(
  params: ListParams<F>,
  page: number,
): ListParams<F> {
  return { ...params, page: Math.max(1, Math.floor(page)) };
}

/**
 * URL-backed list state. Define `defaults` at module scope with
 * defineListDefaults so it keeps the same identity between renders.
 */
export function useListParams<F extends FilterValues>(defaults: ListDefaults<F>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const params = useMemo(
    () => listParamsFromSearch(new URLSearchParams(query), defaults),
    [query, defaults],
  );

  const commit = useCallback(
    (next: ListParams<F>) => {
      const search = listParamsToSearch(next, defaults);
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, defaults],
  );

  const setFilter = useCallback(
    (key: keyof F & string, value: string | undefined) =>
      commit(withFilter(params, { [key]: value } as Partial<Record<keyof F, string>>)),
    [commit, params],
  );
  const setFilters = useCallback(
    (changes: Partial<Record<keyof F, string | undefined>>) =>
      commit(withFilter(params, changes)),
    [commit, params],
  );
  const setSort = useCallback(
    (sort: string, order: SortOrder) => commit(withSort(params, sort, order)),
    [commit, params],
  );
  const setPage = useCallback(
    (page: number) => commit(withPage(params, page)),
    [commit, params],
  );
  /** Clears every filter and the page; keeps the sort. */
  const reset = useCallback(() => {
    const cleared = Object.fromEntries(
      Object.keys(defaults.filters).map((key) => [key, defaults.filters[key]]),
    ) as Partial<Record<keyof F, string | undefined>>;
    commit(withFilter(params, cleared));
  }, [commit, params, defaults]);

  const activeFilterCount = useMemo(() => {
    const values: FilterValues = params;
    return Object.keys(defaults.filters).filter(
      (key) => values[key] !== undefined && values[key] !== defaults.filters[key],
    ).length;
  }, [params, defaults]);

  return { params, setFilter, setFilters, setSort, setPage, reset, activeFilterCount };
}
