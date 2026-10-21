"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Money } from "@/components/money";
import { formatCount, formatDate } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { useOrganizers, type AdminOrganizerRow } from "@/services/v2/organizers";

const DEFAULTS = defineListDefaults({
  filters: { q: undefined, verified: undefined, hasBalance: undefined },
  sort: "processed",
  order: "desc",
});

const VERIFIED_OPTIONS = [
  { value: "true", label: "Verified" },
  { value: "false", label: "Not verified" },
];

const BALANCE_OPTIONS = [
  { value: "true", label: "Has a balance" },
  { value: "false", label: "Empty wallet" },
];

function OrganizerBadges({ organizer }: { organizer: AdminOrganizerRow }) {
  return (
    <span className="flex flex-wrap gap-1">
      {organizer.organizerVerifiedAt && (
        <Badge variant="success" dot>
          Verified
        </Badge>
      )}
      {organizer.suspendedAt && (
        <Badge variant="destructive" dot>
          Suspended
        </Badge>
      )}
    </span>
  );
}

const columns: ColumnDef<AdminOrganizerRow, unknown>[] = [
  {
    id: "name",
    header: "Organizer",
    meta: { sortKey: "name", className: "max-w-[18rem]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="block truncate font-medium text-foreground" title={row.original.name}>
          {row.original.name}
        </span>
        <span className="num block truncate text-xs text-muted-foreground" title={row.original.email}>
          {row.original.email}
        </span>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <OrganizerBadges organizer={row.original} />,
  },
  {
    id: "events",
    header: "Events",
    meta: { align: "right", hideBelow: "lg" },
    cell: ({ row }) => <span className="num">{formatCount(row.original.eventsCount)}</span>,
  },
  {
    id: "processed",
    header: "Processed",
    meta: { sortKey: "processed", align: "right" },
    cell: ({ row }) => <Money value={row.original.processed} />,
  },
  {
    id: "balance",
    header: "Wallet",
    meta: { sortKey: "balance", align: "right" },
    cell: ({ row }) => <Money value={row.original.balance} />,
  },
  {
    id: "createdAt",
    header: "Joined",
    meta: { sortKey: "createdAt", align: "right", hideBelow: "xl" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];

function MobileOrganizer({ organizer }: { organizer: AdminOrganizerRow }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 truncate font-medium text-foreground">{organizer.name}</span>
        <OrganizerBadges organizer={organizer} />
      </div>
      <p className="num truncate text-xs text-muted-foreground">{organizer.email}</p>
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span>
          Processed <Money value={organizer.processed} className="text-foreground" />
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Wallet <Money value={organizer.balance} className="text-foreground" />
        </span>
      </p>
    </div>
  );
}

export default function OrganizersPage() {
  const { params, setFilter, setSort, setPage, reset, activeFilterCount } = useListParams(DEFAULTS);
  const query = useOrganizers(params);

  return (
    <div>
      <PageHeader
        title="Organizers"
        description="Who runs events on Ticketer Africa, what they've sold, and what their wallets hold."
      />

      <FilterBar
        search={{
          value: params.q,
          onChange: (q) => setFilter("q", q),
          placeholder: "Search by name or email",
        }}
        activeCount={activeFilterCount}
        onClear={reset}
      >
        <FilterSelect
          label="Verified"
          anyLabel="Anyone"
          value={params.verified}
          onChange={(verified) => setFilter("verified", verified)}
          options={VERIFIED_OPTIONS}
        />
        <FilterSelect
          label="Wallet"
          anyLabel="Any balance"
          value={params.hasBalance}
          onChange={(hasBalance) => setFilter("hasBalance", hasBalance)}
          options={BALANCE_OPTIONS}
        />
      </FilterBar>

      <DataTable
        label="Organizers"
        noun="organizers"
        columns={columns}
        query={query}
        params={params}
        onSort={setSort}
        onPage={setPage}
        rowHref={(organizer) => `/organizers/${organizer.id}`}
        mobileRow={(organizer) => <MobileOrganizer organizer={organizer} />}
        errorTitle="Couldn't load organizers"
        emptyTitle={activeFilterCount ? "No organizers match these filters" : "No organizers yet"}
        emptyHint={
          activeFilterCount
            ? "Try a shorter name or email, or clear the filters."
            : "People who become organizers show up here."
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
