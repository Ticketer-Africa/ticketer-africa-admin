"use client";

import { useState, type ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/*
 * The frame every chart sits in: title, a Chart / Table switch, the legend,
 * and the loading, error and empty states. While a new range loads, the
 * previous render stays put at reduced opacity (no skeleton flash).
 */

export interface LegendItem {
  label: string;
  /** A token name such as "chart-1". */
  color: string;
  /** Mirror the mark: a short stroke for lines, a block for bars and areas. */
  shape?: "line" | "block";
}

/** The parts of a React Query result the frame needs. */
export interface QueryState {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isFetching: boolean;
  isPlaceholderData?: boolean;
  refetch: () => unknown;
}

interface ChartPanelProps {
  title: string;
  description?: ReactNode;
  legend?: LegendItem[];
  query: QueryState;
  /** True when the data loaded but there is nothing to draw. */
  empty?: boolean;
  emptyTitle?: string;
  emptyHint?: ReactNode;
  /** Figures shown above the chart in both views, outside its states. */
  summary?: ReactNode;
  /** The chart. */
  children: ReactNode;
  /** The same data as a table (naira formatted). */
  table: ReactNode;
  /** Height of the chart area, so loading and empty states don't jump. */
  height?: number;
  className?: string;
}

export const seriesColor = (token: string) => `oklch(var(--${token}))`;

export function Legend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("shrink-0", item.shape === "line" ? "h-0.5 w-3 rounded-full" : "size-2.5 rounded-[2px]")}
            style={{ backgroundColor: seriesColor(item.color) }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartPanel({
  title,
  description,
  legend,
  query,
  empty = false,
  emptyTitle = "Nothing in this range",
  emptyHint = "Pick a longer date range to see more.",
  summary,
  children,
  table,
  height = 240,
  className,
}: ChartPanelProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const refreshing = query.isFetching && query.isPlaceholderData;

  let body: ReactNode;
  if (query.isPending) {
    body = <Skeleton className="w-full" style={{ height }} />;
  } else if (query.isError) {
    body = (
      <ErrorState
        title={`Couldn't load ${title.toLowerCase()}`}
        error={query.error}
        onRetry={() => query.refetch()}
        retrying={query.isFetching}
        className="py-8"
      />
    );
  } else if (empty) {
    body = (
      <div className="flex items-center justify-center" style={{ minHeight: height }}>
        <EmptyState title={emptyTitle} hint={emptyHint} className="py-6" />
      </div>
    );
  } else {
    body = view === "chart" ? children : table;
  }

  const showControls = !query.isPending && !query.isError && !empty;

  return (
    <Panel className={cn("flex min-w-0 flex-col", className)}>
      <PanelHeader>
        <div className="min-w-0">
          <PanelTitle>{title}</PanelTitle>
          {description && <PanelDescription className="mt-0.5">{description}</PanelDescription>}
        </div>
        {showControls && (
          <Segmented
            size="sm"
            aria-label={`Show ${title.toLowerCase()} as`}
            value={view}
            onValueChange={setView}
            options={[
              { value: "chart", label: "Chart" },
              { value: "table", label: "Table" },
            ]}
          />
        )}
      </PanelHeader>
      {summary}
      <div
        aria-busy={refreshing || undefined}
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-3 p-4 transition-opacity duration-state",
          refreshing && "opacity-60",
        )}
      >
        {legend && showControls && view === "chart" && <Legend items={legend} />}
        {body}
      </div>
    </Panel>
  );
}

export interface ChartTableColumn {
  label: string;
  /** Figures align right and use tabular mono digits. */
  numeric?: boolean;
}

/**
 * The table twin of a chart. Wide tables scroll inside the panel, never the
 * page; the first column stays readable as the row's name.
 */
export function ChartTable({
  caption,
  columns,
  rows,
  maxHeight = 360,
}: {
  /** Read by screen readers only; the panel title is the visible caption. */
  caption: string;
  columns: ChartTableColumn[];
  rows: { key: string; cells: ReactNode[] }[];
  maxHeight?: number;
}) {
  return (
    <div className="-m-4 overflow-auto" style={{ maxHeight }}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-[1] bg-surface">
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.label}
                scope="col"
                className={cn(
                  "h-9 whitespace-nowrap px-4 text-xs font-medium text-muted-foreground",
                  column.numeric ? "text-right" : "text-left",
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border last:border-0">
              {row.cells.map((cell, index) => {
                const column = columns[index];
                const Cell = index === 0 ? "th" : "td";
                return (
                  <Cell
                    key={column?.label ?? index}
                    scope={index === 0 ? "row" : undefined}
                    className={cn(
                      "h-9 whitespace-nowrap px-4 text-left font-normal text-foreground",
                      column?.numeric && "num text-right",
                    )}
                  >
                    {cell}
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
