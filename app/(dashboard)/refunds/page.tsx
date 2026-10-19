"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { DateRangePicker } from "@/components/date-range-picker";
import { EntityLink } from "@/components/entity-link";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { REFUND_MODE_LABELS, useRefunds, type AdminRefundRow } from "@/services/v2/refunds";

const DEFAULTS = defineListDefaults({
  filters: {
    status: undefined,
    mode: undefined,
    from: undefined,
    to: undefined,
  },
  sort: "createdAt",
  order: "desc",
});

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

const MODE_OPTIONS = Object.entries(REFUND_MODE_LABELS).map(([value, label]) => ({ value, label }));

const columns: ColumnDef<AdminRefundRow, unknown>[] = [
  {
    id: "buyer",
    header: "Buyer",
    meta: { className: "max-w-[15rem]" },
    cell: ({ row }) => {
      const buyer = row.original.transaction?.user;
      return buyer ? (
        <div className="min-w-0">
          <span className="block truncate" title={buyer.name}>
            {buyer.name}
          </span>
          <span className="num block truncate text-xs text-muted-foreground" title={buyer.email}>
            {buyer.email}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground">Transaction not found</span>
      );
    },
  },
  {
    id: "transaction",
    header: "Transaction",
    meta: { hideBelow: "lg", className: "max-w-[13rem]" },
    cell: ({ row }) => {
      const txn = row.original.transaction;
      return txn ? (
        <EntityLink kind="transaction" id={txn.id} label={txn.reference} mono className="text-xs" />
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "event",
    header: "Event",
    meta: { hideBelow: "xl", className: "max-w-[14rem]" },
    cell: ({ row }) => {
      const event = row.original.transaction?.event;
      return event ? (
        <EntityLink kind="event" id={event.id} label={event.name} />
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "mode",
    header: "Mode",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{REFUND_MODE_LABELS[row.original.mode]}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge kind="refund" value={row.original.status} />,
  },
  {
    id: "amount",
    header: "Amount",
    meta: { sortKey: "amount", align: "right" },
    cell: ({ row }) => <Money value={row.original.amount} />,
  },
  {
    id: "createdAt",
    header: "Started",
    meta: { sortKey: "createdAt", align: "right", hideBelow: "lg" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "updatedAt",
    header: "Last change",
    meta: { sortKey: "updatedAt", align: "right", hideBelow: "xl" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(row.original.updatedAt)}
      </span>
    ),
  },
];

function MobileRefund({ refund }: { refund: AdminRefundRow }) {
  const txn = refund.transaction;
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <Money value={refund.amount} className="font-medium text-foreground" />
        <StatusBadge kind="refund" value={refund.status} />
      </div>
      <p className="truncate text-sm text-foreground" title={txn?.user.email}>
        {txn ? (
          <>
            {txn.user.name}
            <span className="num text-xs text-muted-foreground"> · {txn.user.email}</span>
          </>
        ) : (
          "Transaction not found"
        )}
      </p>
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span>{REFUND_MODE_LABELS[refund.mode]}</span>
        <span aria-hidden="true">·</span>
        <span className="num">{formatDateTime(refund.createdAt)}</span>
        {txn?.event && (
          <>
            <span aria-hidden="true">·</span>
            <span className="min-w-0 truncate">{txn.event.name}</span>
          </>
        )}
      </p>
    </div>
  );
}

export default function RefundsPage() {
  const { params, setFilter, setFilters, setSort, setPage, reset, activeFilterCount } =
    useListParams(DEFAULTS);
  const query = useRefunds(params);

  return (
    <div>
      <PageHeader
        title="Refunds"
        description="Money going back to buyers, through Korapay or by hand, and what was reversed from wallets."
      />

      <FilterBar activeCount={activeFilterCount} onClear={reset}>
        <FilterSelect
          label="Status"
          anyLabel="Any status"
          value={params.status}
          onChange={(status) => setFilter("status", status)}
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          label="Mode"
          anyLabel="Any mode"
          value={params.mode}
          onChange={(mode) => setFilter("mode", mode)}
          options={MODE_OPTIONS}
        />
        <DateRangePicker
          label="Started"
          value={{ from: params.from, to: params.to }}
          onChange={(range) => setFilters({ from: range.from, to: range.to })}
        />
      </FilterBar>

      <DataTable
        label="Refunds"
        noun="refunds"
        columns={columns}
        query={query}
        params={params}
        onSort={setSort}
        onPage={setPage}
        rowHref={(refund) => `/refunds/${refund.id}`}
        mobileRow={(refund) => <MobileRefund refund={refund} />}
        errorTitle="Couldn't load refunds"
        emptyTitle={activeFilterCount ? "No refunds match these filters" : "No refunds yet"}
        emptyHint={
          activeFilterCount
            ? "Try another status or mode, or a wider date range."
            : "Refunds appear here once an approved refund request runs. Start one from a transaction."
        }
        emptyAction={
          activeFilterCount ? (
            <Button variant="secondary" size="sm" onClick={reset}>
              Clear filters
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
