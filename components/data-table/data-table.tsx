"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import type { UseQueryResult } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, ArrowUpDownIcon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SortOrder } from "@/lib/list-params";
import { cn } from "@/lib/utils";
import type { Paged } from "@/services/v2/types";
import { MobileRows, MobileRowsSkeleton, MobileSort, type SortOption } from "./mobile-rows";
import { Pagination } from "./pagination";

/*
 * Server-driven list: the API pages and sorts, this renders.
 *
 * Column meta (all optional):
 *   sortKey     backend sort field; makes the header a sort button
 *   firstOrder  direction on the first click (default "desc", use "asc" for text)
 *   align       "right" for numbers and money
 *   hideBelow   "lg" | "xl" hides the column on narrower screens
 *   className   extra classes on every cell of the column
 *
 * Row links: with `rowHref`, the first column's content becomes a real <a>
 * whose hit area stretches over the whole row, so rows work with Tab/Enter,
 * middle-click and "open in new tab". Interactive things inside other cells
 * (e.g. EntityLink) sit above it.
 */

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    sortKey?: string;
    firstOrder?: SortOrder;
    align?: "left" | "right";
    hideBelow?: "lg" | "xl";
    className?: string;
  }
}

export type { ColumnDef };

export interface DataTableParams {
  sort: string;
  order: SortOrder;
  page: number;
  pageSize: number;
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  query: UseQueryResult<Paged<T>, unknown>;
  params: DataTableParams;
  onSort: (sort: string, order: SortOrder) => void;
  onPage: (page: number) => void;
  /** Where a row goes when clicked. */
  rowHref?: (row: T) => string;
  /** The phone version of a row: 3–4 key fields. */
  mobileRow: (row: T) => ReactNode;
  getRowId?: (row: T) => string;
  /** Accessible name for the table, e.g. "Users". */
  label: string;
  /** Plural noun for the count, e.g. "users". */
  noun?: string;
  emptyTitle: string;
  emptyHint?: ReactNode;
  /** Usually "Clear filters" when filters are on. */
  emptyAction?: ReactNode;
  /** Shown in the error state: "Couldn't load users". */
  errorTitle?: string;
  className?: string;
}

const EMPTY_ROWS: never[] = [];
const SKELETON_ROWS = 8;

const hideClass = { lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" } as const;

const defaultRowId = (row: unknown) => String((row as { id: string }).id);

export function DataTable<T>({
  columns,
  query,
  params,
  onSort,
  onPage,
  rowHref,
  mobileRow,
  getRowId = defaultRowId,
  label,
  noun,
  emptyTitle,
  emptyHint,
  emptyAction,
  errorTitle = "Couldn't load this list",
  className,
}: DataTableProps<T>) {
  const rows = query.data?.items ?? (EMPTY_ROWS as T[]);
  // TanStack Table returns a fresh-but-mutable table each render; the React
  // Compiler can't memoise around it, which is fine here (no compiler build).
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => getRowId(row),
    manualPagination: true,
    manualSorting: true,
  });

  const sortOptions = useMemo<SortOption[]>(
    () =>
      columns.flatMap((column) =>
        column.meta?.sortKey && typeof column.header === "string"
          ? [{ key: column.meta.sortKey, label: column.header, firstOrder: column.meta.firstOrder ?? "desc" }]
          : [],
      ),
    [columns],
  );

  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const dimmed = query.isPlaceholderData;
  const total = query.data?.total ?? 0;

  const headerRow = (
    <TableHeader>
      <TableRow>
        {headers.map((header) => {
          const meta = header.column.columnDef.meta;
          const sortKey = meta?.sortKey;
          const active = sortKey !== undefined && params.sort === sortKey;
          const title = header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext());
          return (
            <TableHead
              key={header.id}
              scope="col"
              aria-sort={
                sortKey ? (active ? (params.order === "asc" ? "ascending" : "descending") : "none") : undefined
              }
              className={cn(cellClass(meta), meta?.align === "right" && "text-right")}
            >
              {sortKey ? (
                <button
                  type="button"
                  onClick={() =>
                    onSort(
                      sortKey,
                      active ? (params.order === "asc" ? "desc" : "asc") : (meta?.firstOrder ?? "desc"),
                    )
                  }
                  className={cn(
                    "-mx-1 inline-flex h-7 items-center gap-1 rounded px-1 transition-colors duration-state hover:text-foreground",
                    active && "text-foreground",
                    meta?.align === "right" && "flex-row-reverse",
                  )}
                >
                  {title}
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={active ? (params.order === "asc" ? ArrowUp01Icon : ArrowDown01Icon) : ArrowUpDownIcon}
                    className={cn("size-3.5", !active && "opacity-50")}
                  />
                </button>
              ) : (
                title
              )}
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );

  let body: ReactNode;
  if (query.isPending) {
    body = (
      <>
        <div className="hidden md:block">
          <Table aria-label={label} aria-busy="true">
            {headerRow}
            <TableBody>
              {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {headers.map((header) => (
                    <TableCell key={header.id} className={cellClass(header.column.columnDef.meta)}>
                      <Skeleton
                        className={cn(
                          "h-3.5",
                          header.column.columnDef.meta?.align === "right" ? "ml-auto w-16" : "w-3/4",
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden">
          <MobileRowsSkeleton />
        </div>
      </>
    );
  } else if (query.isError) {
    body = (
      <ErrorState
        title={errorTitle}
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  } else if (rows.length === 0) {
    body =
      params.page > 1 && total > 0 ? (
        <EmptyState
          title="This page is past the end of the list"
          hint="The list got shorter since this link was made."
          action={
            <Button variant="secondary" size="sm" onClick={() => onPage(1)}>
              Go to the first page
            </Button>
          }
        />
      ) : (
        <EmptyState title={emptyTitle} hint={emptyHint} action={emptyAction} />
      );
  } else {
    body = (
      <>
        <div className="hidden md:block">
          <Table aria-label={label} aria-busy={query.isFetching || undefined}>
            {headerRow}
            <TableBody className={cn("transition-opacity duration-state", dimmed && "opacity-60")}>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={cn(rowHref && "relative cursor-pointer")}>
                  {row.getVisibleCells().map((cell, index) => {
                    const content = flexRender(cell.column.columnDef.cell, cell.getContext());
                    return (
                      <TableCell key={cell.id} className={cellClass(cell.column.columnDef.meta)}>
                        {index === 0 && rowHref ? (
                          <Link
                            href={rowHref(row.original)}
                            className={cn(
                              "block min-w-0 font-medium text-foreground focus-visible:outline-none",
                              "after:absolute after:inset-0 after:content-['']",
                              "focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring",
                            )}
                          >
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden">
          <MobileSort
            options={sortOptions}
            sort={params.sort}
            order={params.order}
            onSort={onSort}
          />
          <MobileRows
            rows={rows}
            getKey={getRowId}
            render={mobileRow}
            href={rowHref}
            dimmed={dimmed}
          />
        </div>
      </>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      {body}
      {!query.isError && rows.length > 0 && (
        <Pagination
          page={params.page}
          pageSize={params.pageSize}
          total={total}
          onPage={onPage}
          noun={noun}
        />
      )}
    </div>
  );
}

function cellClass(meta: { align?: "left" | "right"; hideBelow?: "lg" | "xl"; className?: string } | undefined) {
  return cn(
    meta?.align === "right" && "text-right",
    meta?.hideBelow && hideClass[meta.hideBelow],
    meta?.className,
  );
}
