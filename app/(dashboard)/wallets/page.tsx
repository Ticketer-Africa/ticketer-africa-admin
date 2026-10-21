"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FilterBar } from "@/components/data-table/filter-bar";
import { Money } from "@/components/money";
import { formatCount, formatDateTime } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { useWalletMismatches, useWallets, type AdminWalletRow } from "@/services/v2/wallets";

const DEFAULTS = defineListDefaults({
  filters: { q: undefined, mismatch: undefined },
  sort: "balance",
  order: "desc",
});

const ROLE_LABELS: Record<string, string> = {
  USER: "User",
  ORGANIZER: "Organizer",
  ADMIN: "Admin",
  SUPERADMIN: "Superadmin",
};

const columns: ColumnDef<AdminWalletRow, unknown>[] = [
  {
    id: "owner",
    header: "Owner",
    meta: { className: "max-w-[18rem]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground" title={row.original.name}>
            {row.original.name}
          </span>
          {row.original.isPlatform && <Badge variant="info">Ticketer Africa</Badge>}
        </span>
        <span className="num block truncate text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    id: "role",
    header: "Role",
    meta: { hideBelow: "lg" },
    cell: ({ row }) => <span className="text-muted-foreground">{ROLE_LABELS[row.original.role] ?? row.original.role}</span>,
  },
  {
    id: "lastEntryAt",
    header: "Last entry",
    meta: { sortKey: "lastEntryAt", hideBelow: "lg" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">
        {row.original.lastEntryAt ? formatDateTime(row.original.lastEntryAt) : "—"}
      </span>
    ),
  },
  {
    id: "balance",
    header: "Balance",
    meta: { sortKey: "balance", align: "right" },
    cell: ({ row }) => <Money value={row.original.balance} />,
  },
];

function MismatchBanner({ onShow, showing }: { onShow: () => void; showing: boolean }) {
  const mismatches = useWalletMismatches();
  const count = mismatches.data?.total ?? 0;
  if (!count) return null;
  return (
    <Panel className="mb-5 flex flex-col gap-3 border-warning/50 bg-warning/5 p-4 sm:flex-row sm:items-center sm:justify-between" role="status">
      <p className="flex items-start gap-2 text-sm text-foreground">
        <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
        <span>
          {formatCount(count)} wallet{count === 1 ? "'s balance doesn't" : "s' balances don't"} match{count === 1 ? "es" : ""} their ledger.
          Open each one to see the entries.
        </span>
      </p>
      {!showing && (
        <Button variant="secondary" size="sm" onClick={onShow}>
          Show them
        </Button>
      )}
    </Panel>
  );
}

export default function WalletsPage() {
  const { params, setFilter, setSort, setPage, reset, activeFilterCount } = useListParams(DEFAULTS);
  const query = useWallets(params);

  return (
    <div>
      <PageHeader
        title="Wallets"
        description="What organizers are owed and what Ticketer Africa holds. Every change is a ledger entry."
      />
      <MismatchBanner showing={params.mismatch === "1"} onShow={() => setFilter("mismatch", "1")} />
      <FilterBar
        search={{
          value: params.q,
          onChange: (q) => setFilter("q", q),
          placeholder: "Search by name or email",
        }}
        activeCount={activeFilterCount}
        onClear={reset}
      />
      <DataTable
        label="Wallets"
        noun="wallets"
        columns={columns}
        query={query}
        params={params}
        onSort={setSort}
        onPage={setPage}
        getRowId={(wallet) => wallet.userId}
        rowHref={(wallet) => `/wallets/${wallet.userId}`}
        mobileRow={(wallet) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{wallet.name}</p>
              <p className="num truncate text-xs text-muted-foreground">{wallet.email}</p>
            </div>
            <Money value={wallet.balance} className="shrink-0 text-foreground" />
          </div>
        )}
        errorTitle="Couldn't load wallets"
        emptyTitle={activeFilterCount ? "No wallets match" : "No wallets yet"}
        emptyHint={
          params.mismatch === "1"
            ? "Every wallet's balance matches its ledger."
            : activeFilterCount
              ? "Try a shorter name or email."
              : "Organizers get a wallet when they're set up."
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
