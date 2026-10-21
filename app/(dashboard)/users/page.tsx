"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { DateRangePicker } from "@/components/date-range-picker";
import { ExportButton } from "@/components/export-button";
import { Money } from "@/components/money";
import { StatusBadge, userStatus } from "@/components/status-badge";
import { formatCount, formatDate } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { useUsers, type AdminUserRow } from "@/services/v2/users";
import type { Role } from "@/services/v2/types";

const DEFAULTS = defineListDefaults({
  filters: {
    q: undefined,
    role: undefined,
    verified: undefined,
    suspended: undefined,
    joinedFrom: undefined,
    joinedTo: undefined,
  },
  sort: "createdAt",
  order: "desc",
});

const ROLE_LABELS: Record<Role, string> = {
  USER: "User",
  ORGANIZER: "Organizer",
  ADMIN: "Admin",
  SUPERADMIN: "Superadmin",
};

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

const columns: ColumnDef<AdminUserRow, unknown>[] = [
  {
    id: "name",
    header: "Name",
    meta: { sortKey: "name", firstOrder: "asc", className: "max-w-[16rem]" },
    cell: ({ row }) => (
      <span className="block truncate" title={row.original.name}>
        {row.original.name}
      </span>
    ),
  },
  {
    id: "email",
    header: "Email",
    meta: { sortKey: "email", firstOrder: "asc", className: "max-w-[18rem]" },
    cell: ({ row }) => (
      <span className="num block truncate text-xs text-muted-foreground" title={row.original.email}>
        {row.original.email}
      </span>
    ),
  },
  {
    id: "role",
    header: "Role",
    meta: { hideBelow: "lg" },
    cell: ({ row }) => <Badge variant="outline">{ROLE_LABELS[row.original.role]}</Badge>,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge kind="user" value={userStatus(row.original)} />,
  },
  {
    id: "events",
    header: "Events",
    meta: { align: "right", hideBelow: "xl" },
    cell: ({ row }) => <span className="num">{formatCount(row.original.eventsCount)}</span>,
  },
  {
    id: "totalSpent",
    header: "Total spent",
    meta: { sortKey: "totalSpent", align: "right" },
    cell: ({ row }) => <Money value={row.original.totalSpent} />,
  },
  {
    id: "createdAt",
    header: "Joined",
    meta: { sortKey: "createdAt", align: "right", hideBelow: "lg" },
    cell: ({ row }) => (
      <span className="num text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
];

function MobileUser({ user }: { user: AdminUserRow }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate font-medium text-foreground" title={user.name}>
          {user.name}
        </span>
        <StatusBadge kind="user" value={userStatus(user)} />
      </div>
      <p className="num truncate text-xs text-muted-foreground" title={user.email}>
        {user.email}
      </p>
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span>{ROLE_LABELS[user.role]}</span>
        <span aria-hidden="true">·</span>
        <span>
          Spent <Money value={user.totalSpent} className="text-foreground" />
        </span>
        <span aria-hidden="true">·</span>
        <span className="num">Joined {formatDate(user.createdAt)}</span>
      </p>
    </div>
  );
}

export default function UsersPage() {
  const { params, setFilter, setFilters, setSort, setPage, reset, activeFilterCount } =
    useListParams(DEFAULTS);
  const query = useUsers(params);

  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone with a Ticketer Africa account: buyers, organizers and admins."
        actions={<ExportButton path="/users/export" params={params} filename="users" />}
      />

      <FilterBar
        search={{
          value: params.q,
          onChange: (q) => setFilter("q", q),
          placeholder: "Search name or email",
        }}
        activeCount={activeFilterCount}
        onClear={reset}
      >
        <FilterSelect
          label="Role"
          anyLabel="Any role"
          value={params.role}
          onChange={(role) => setFilter("role", role)}
          options={ROLE_OPTIONS}
        />
        <FilterSelect
          label="Status"
          anyLabel="Any status"
          value={params.suspended}
          onChange={(suspended) => setFilter("suspended", suspended)}
          options={[
            { value: "false", label: "Not suspended" },
            { value: "true", label: "Suspended" },
          ]}
        />
        <FilterSelect
          label="Email"
          anyLabel="Verified or not"
          value={params.verified}
          onChange={(verified) => setFilter("verified", verified)}
          options={[
            { value: "true", label: "Verified" },
            { value: "false", label: "Unverified" },
          ]}
        />
        <DateRangePicker
          label="Joined"
          value={{ from: params.joinedFrom, to: params.joinedTo }}
          onChange={(range) => setFilters({ joinedFrom: range.from, joinedTo: range.to })}
        />
      </FilterBar>

      <DataTable
        label="Users"
        noun="users"
        columns={columns}
        query={query}
        params={params}
        onSort={setSort}
        onPage={setPage}
        rowHref={(user) => `/users/${user.id}`}
        mobileRow={(user) => <MobileUser user={user} />}
        errorTitle="Couldn't load users"
        emptyTitle={activeFilterCount ? "No users match these filters" : "No users yet"}
        emptyHint={
          activeFilterCount
            ? "Try a shorter search, different role, status or email filters, or a wider join date."
            : "People appear here once they sign up."
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
