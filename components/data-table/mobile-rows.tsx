"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown02Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SortOrder } from "@/lib/list-params";

/*
 * Phones (<768px) get stacked items instead of a table: each row is one
 * link holding the 3–4 fields that matter, so nothing scrolls sideways.
 */

interface MobileRowsProps<T> {
  rows: T[];
  getKey: (row: T) => string;
  render: (row: T) => ReactNode;
  href?: (row: T) => string;
  dimmed?: boolean;
}

export function MobileRows<T>({ rows, getKey, render, href, dimmed }: MobileRowsProps<T>) {
  return (
    <ul className={cn("divide-y divide-border transition-opacity duration-state", dimmed && "opacity-60")}>
      {rows.map((row) => (
        <li key={getKey(row)}>
          {href ? (
            <Link
              href={href(row)}
              className="block min-w-0 px-4 py-3 transition-colors duration-state hover:bg-muted/60 focus-visible:-outline-offset-2"
            >
              {render(row)}
            </Link>
          ) : (
            <div className="min-w-0 px-4 py-3">{render(row)}</div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function MobileRowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul aria-hidden="true" className="divide-y divide-border">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="space-y-2 px-4 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-1/3" />
        </li>
      ))}
    </ul>
  );
}

export interface SortOption {
  key: string;
  label: string;
  firstOrder: SortOrder;
}

interface MobileSortProps {
  options: SortOption[];
  sort: string;
  order: SortOrder;
  onSort: (sort: string, order: SortOrder) => void;
}

/** The table's sortable columns as a select plus a direction toggle. */
export function MobileSort({ options, sort, order, onSort }: MobileSortProps) {
  if (!options.length) return null;
  const current = options.find((option) => option.key === sort);
  return (
    <div className="flex items-center justify-end gap-2 border-b border-border px-4 py-2">
      <Select
        value={current?.key}
        onValueChange={(key) => {
          const option = options.find((o) => o.key === key);
          if (option) onSort(option.key, option.firstOrder);
        }}
      >
        <SelectTrigger className="w-auto gap-1.5" aria-label={`Sort by ${current?.label ?? "default"}`}>
          <span className="text-muted-foreground">Sort</span>
          <span>{current?.label ?? "Default"}</span>
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="secondary"
        size="icon"
        aria-label={order === "asc" ? "Ascending. Switch to descending" : "Descending. Switch to ascending"}
        onClick={() => onSort(sort, order === "asc" ? "desc" : "asc")}
      >
        <HugeiconsIcon icon={order === "asc" ? ArrowUp02Icon : ArrowDown02Icon} />
      </Button>
    </div>
  );
}
