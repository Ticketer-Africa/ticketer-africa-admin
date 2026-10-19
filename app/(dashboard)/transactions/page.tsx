"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { AmountRangeFilter } from "@/components/data-table/amount-range-filter";
import { EventFilter } from "@/components/data-table/event-filter";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { DateRangePicker } from "@/components/date-range-picker";
import { EntityLink } from "@/components/entity-link";
import { ExportButton } from "@/components/export-button";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { formatCount, formatDateTime } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import {
  TRANSACTION_TYPE_LABELS as TYPE_LABELS,
  useTransactions,
  type AdminTransactionRow,
} from "@/services/v2/transactions";

const DEFAULTS = defineListDefaults({
  filters: {
    q: undefined,
    status: undefined,
    type: undefined,
    eventId: undefined,
    from: undefined,
    to: undefined,
    minAmount: undefined,
    maxAmount: undefined,
  },
  sort: "createdAt",
  order: "desc",
});

const STATUS_OPTIONS = [
  { value: "SUCCESS", label: "Successful" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

const columns: ColumnDef<AdminTransactionRow, unknown>[] = [
  {
    id: "reference",
    header: "Reference",
    meta: { className: "max-w-[13rem]" },
    cell: ({ row }) => (
      <span className="num block truncate text-xs" title={row.original.reference}>
        {row.original.reference}
      </span>
    ),
  },
  {
    id: "buyer",
    header: "Buyer",
    meta: { className: "max-w-[15rem]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="block truncate" title={row.original.user.name}>
          {row.original.user.name}
        </span>
        <span
          className="num block truncate text-xs text-muted-foreground"
          title={row.original.user.email}
        >
          {row.original.user.email}
        </span>
      </div>
    ),
  },
  {
    id: "event",
    header: "Event",
    meta: { hideBelow: "lg", className: "max-w-[14rem]" },
    cell: ({ row }) =>
      row.original.event ? (
        <EntityLink kind="event" id={row.original.event.id} label={row.original.event.name} />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "type",
    header: "Type",
    meta: { hideBelow: "xl" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {TYPE_LABELS[row.original.type]}
        {row.original.ticketCount > 0 && (
          <span className="num"> · {formatCount(row.original.ticketCount)}×</span>
        )}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge kind="transaction" value={row.original.status} />,
  },
  {
    id: "amount",
    header: "Amount",
    meta: { sortKey: "amount", align: "right" },
    cell: ({ row }) => <Money value={row.original.amount} />,
  },
  {
    id: "createdAt",
    header: "Date",
    meta: { sortKey: "createdAt", align: "right", hideBelow: "lg" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
];

function MobileTransaction({ txn }: { txn: AdminTransactionRow }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <Money value={txn.amount} className="font-medium text-foreground" />
        <StatusBadge kind="transaction" value={txn.status} />
      </div>
      <p className="truncate text-sm text-foreground" title={txn.user.email}>
        {txn.user.name}
        <span className="num text-xs text-muted-foreground"> · {txn.user.email}</span>
      </p>
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{txn.event?.name ?? TYPE_LABELS[txn.type]}</span>
        <span aria-hidden="true">·</span>
        <span className="num">{formatDateTime(txn.createdAt)}</span>
      </p>
      <p className="num truncate text-xs text-muted-foreground">{txn.reference}</p>
    </div>
  );
}

export default function TransactionsPage() {
  const { params, setFilter, setFilters, setSort, setPage, reset, activeFilterCount } =
    useListParams(DEFAULTS);
  const query = useTransactions(params);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Every payment: ticket purchases, resales, top-ups and withdrawals."
        actions={
          <ExportButton path="/transactions/export" params={params} filename="transactions" />
        }
      />

      <FilterBar
        search={{
          value: params.q,
          onChange: (q) => setFilter("q", q),
          placeholder: "Search reference or buyer email",
        }}
        activeCount={activeFilterCount}
        onClear={reset}
      >
        <FilterSelect
          label="Status"
          anyLabel="Any status"
          value={params.status}
          onChange={(status) => setFilter("status", status)}
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          label="Type"
          anyLabel="Any type"
          value={params.type}
          onChange={(type) => setFilter("type", type)}
          options={TYPE_OPTIONS}
        />
        <EventFilter value={params.eventId} onChange={(eventId) => setFilter("eventId", eventId)} />
        <DateRangePicker
          label="Date"
          value={{ from: params.from, to: params.to }}
          onChange={(range) => setFilters({ from: range.from, to: range.to })}
        />
        <AmountRangeFilter
          value={{ min: params.minAmount, max: params.maxAmount }}
          onChange={(range) => setFilters({ minAmount: range.min, maxAmount: range.max })}
        />
      </FilterBar>

      <DataTable
        label="Transactions"
        noun="transactions"
        columns={columns}
        query={query}
        params={params}
        onSort={setSort}
        onPage={setPage}
        rowHref={(txn) => `/transactions/${txn.id}`}
        mobileRow={(txn) => <MobileTransaction txn={txn} />}
        errorTitle="Couldn't load transactions"
        emptyTitle={
          activeFilterCount ? "No transactions match these filters" : "No transactions yet"
        }
        emptyHint={
          activeFilterCount
            ? "Try a shorter reference or email, another status, type or event, a wider date range or amount range."
            : "Payments appear here as soon as someone starts a checkout."
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
