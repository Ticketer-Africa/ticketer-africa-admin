"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PayoutPauseControl } from "@/components/payout-pause-control";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { DateRangePicker } from "@/components/date-range-picker";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { PROVIDER_LABELS, usePayouts, type AdminPayoutRow } from "@/services/v2/payouts";

const DEFAULTS = defineListDefaults({
  filters: {
    q: undefined,
    status: undefined,
    provider: undefined,
    walletBacked: undefined,
    userId: undefined,
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

const PROVIDER_OPTIONS = Object.entries(PROVIDER_LABELS).map(([value, label]) => ({ value, label }));

type Kind = "all" | "true" | "false";

function Bank({ payout }: { payout: AdminPayoutRow }) {
  return (
    <span className="block truncate text-xs text-muted-foreground">
      {payout.destination.bankName ?? "Bank"}
      {payout.destination.accountLast4 && <span className="num"> •••• {payout.destination.accountLast4}</span>}
    </span>
  );
}

const columns: ColumnDef<AdminPayoutRow, unknown>[] = [
  {
    id: "recipient",
    header: "Recipient",
    meta: { className: "max-w-[16rem]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="block truncate" title={row.original.user.name}>
          {row.original.user.name}
        </span>
        <Bank payout={row.original} />
      </div>
    ),
  },
  {
    id: "kind",
    header: "Kind",
    meta: { hideBelow: "xl" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.walletBacked ? "Withdrawal" : "Settlement"} · {PROVIDER_LABELS[row.original.provider]}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge kind="payout" value={row.original.status} />,
  },
  {
    id: "amount",
    header: "Amount",
    meta: { sortKey: "amount", align: "right" },
    cell: ({ row }) => <Money value={row.original.amount} />,
  },
  {
    id: "createdAt",
    header: "Requested",
    meta: { sortKey: "createdAt", align: "right", hideBelow: "lg" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
];

function MobilePayout({ payout }: { payout: AdminPayoutRow }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <Money value={payout.amount} className="font-medium text-foreground" />
        <StatusBadge kind="payout" value={payout.status} />
      </div>
      <p className="truncate text-sm text-foreground">{payout.user.name}</p>
      <Bank payout={payout} />
      <p className="num text-xs text-muted-foreground">{formatDateTime(payout.createdAt)}</p>
    </div>
  );
}

export default function PayoutsPage() {
  const { params, setFilter, setFilters, setSort, setPage, reset, activeFilterCount } =
    useListParams(DEFAULTS);
  const query = usePayouts(params);
  const kind: Kind = (params.walletBacked as Kind | undefined) ?? "all";

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Money going out: organizer withdrawals and resale seller settlements, and the switch that stops them."
        actions={
          <Button variant="secondary" asChild>
            <Link href="/payouts/bank-details">Bank details to review</Link>
          </Button>
        }
      />

      <PayoutPauseControl className="mb-5" />

      <Segmented<Kind>
        aria-label="Kind of payout"
        className="mb-3"
        value={kind}
        onValueChange={(value) => setFilter("walletBacked", value === "all" ? undefined : value)}
        options={[
          { value: "all", label: "All" },
          { value: "true", label: "Withdrawals" },
          { value: "false", label: "Settlements" },
        ]}
      />

      <FilterBar
        search={{
          value: params.q,
          onChange: (q) => setFilter("q", q),
          placeholder: "Search reference, name or email",
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
          label="Provider"
          anyLabel="Any provider"
          value={params.provider}
          onChange={(provider) => setFilter("provider", provider)}
          options={PROVIDER_OPTIONS}
        />
        <DateRangePicker
          label="Requested"
          value={{ from: params.from, to: params.to }}
          onChange={(range) => setFilters({ from: range.from, to: range.to })}
        />
      </FilterBar>

      <DataTable
        label="Payouts"
        noun="payouts"
        columns={columns}
        query={query}
        params={params}
        onSort={setSort}
        onPage={setPage}
        rowHref={(payout) => `/payouts/${payout.id}`}
        mobileRow={(payout) => <MobilePayout payout={payout} />}
        errorTitle="Couldn't load payouts"
        emptyTitle={activeFilterCount ? "No payouts match these filters" : "No payouts yet"}
        emptyHint={
          activeFilterCount
            ? "Try another status or provider, or a wider date range."
            : "Withdrawals show up here when organizers cash out."
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
