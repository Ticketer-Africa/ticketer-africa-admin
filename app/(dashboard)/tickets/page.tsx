"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { EventFilter } from "@/components/data-table/event-filter";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { EntityLink } from "@/components/entity-link";
import { Money } from "@/components/money";
import { TicketBadges } from "@/components/ticket-badges";
import { formatDateTime } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { useTickets, type AdminTicketRow } from "@/services/v2/tickets";

const DEFAULTS = defineListDefaults({
  filters: {
    q: undefined,
    eventId: undefined,
    used: undefined,
    voided: undefined,
    listed: undefined,
  },
  sort: "createdAt",
  order: "desc",
});

const CHECKED_IN_OPTIONS = [
  { value: "true", label: "Checked in" },
  { value: "false", label: "Not checked in" },
];
const VOIDED_OPTIONS = [
  { value: "true", label: "Voided or refunded" },
  { value: "false", label: "Not voided" },
];
const LISTED_OPTIONS = [
  { value: "true", label: "Listed for resale" },
  { value: "false", label: "Not listed" },
];

/** The person holding the ticket, and who it was bought for if someone else. */
function OwnerCell({ ticket }: { ticket: AdminTicketRow }) {
  const forSomeoneElse =
    ticket.recipientEmail && ticket.recipientEmail !== ticket.owner.email ? ticket.recipientEmail : null;
  return (
    <div className="min-w-0">
      <span className="block truncate" title={ticket.owner.name}>
        {ticket.owner.name}
      </span>
      <span className="num block truncate text-xs text-muted-foreground" title={ticket.owner.email}>
        {ticket.owner.email}
      </span>
      {forSomeoneElse && (
        <span className="num block truncate text-xs text-muted-foreground" title={forSomeoneElse}>
          for {forSomeoneElse}
        </span>
      )}
    </div>
  );
}

const columns: ColumnDef<AdminTicketRow, unknown>[] = [
  {
    id: "code",
    header: "Code",
    cell: ({ row }) => <span className="num whitespace-nowrap text-sm">{row.original.code}</span>,
  },
  {
    id: "owner",
    header: "Owner",
    meta: { className: "max-w-[16rem]" },
    cell: ({ row }) => <OwnerCell ticket={row.original} />,
  },
  {
    id: "event",
    header: "Event",
    meta: { hideBelow: "lg", className: "max-w-[14rem]" },
    cell: ({ row }) => (
      <EntityLink kind="event" id={row.original.event.id} label={row.original.event.name} />
    ),
  },
  {
    id: "category",
    header: "Category",
    meta: { hideBelow: "xl", className: "max-w-[10rem]" },
    cell: ({ row }) =>
      row.original.category ? (
        <span className="block truncate text-muted-foreground" title={row.original.category.name}>
          {row.original.category.name}
          <span className="text-xs">
            {" · "}
            <Money value={row.original.category.price} />
          </span>
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        <TicketBadges {...row.original} />
      </div>
    ),
  },
  {
    id: "createdAt",
    header: "Issued",
    meta: { sortKey: "createdAt", align: "right", hideBelow: "lg" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
];

function MobileTicket({ ticket }: { ticket: AdminTicketRow }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <span className="num text-sm font-medium text-foreground">{ticket.code}</span>
        <div className="flex flex-wrap justify-end gap-1">
          <TicketBadges {...ticket} />
        </div>
      </div>
      <p className="truncate text-sm text-foreground" title={ticket.owner.email}>
        {ticket.owner.name}
        <span className="num text-xs text-muted-foreground"> · {ticket.owner.email}</span>
      </p>
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{ticket.event.name}</span>
        {ticket.category && (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">{ticket.category.name}</span>
          </>
        )}
      </p>
    </div>
  );
}

export default function TicketsPage() {
  const { params, setFilter, setSort, setPage, reset, activeFilterCount } = useListParams(DEFAULTS);
  const query = useTickets(params);

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Find a ticket by its code or its owner's email, then see its scans and payments, or undo a check-in."
      />

      <FilterBar
        search={{
          value: params.q,
          onChange: (q) => setFilter("q", q),
          placeholder: "Ticket code or owner email",
        }}
        activeCount={activeFilterCount}
        onClear={reset}
      >
        <EventFilter value={params.eventId} onChange={(eventId) => setFilter("eventId", eventId)} />
        <FilterSelect
          label="Check-in"
          anyLabel="Any"
          value={params.used}
          onChange={(used) => setFilter("used", used)}
          options={CHECKED_IN_OPTIONS}
        />
        <FilterSelect
          label="Voided"
          anyLabel="Any"
          value={params.voided}
          onChange={(voided) => setFilter("voided", voided)}
          options={VOIDED_OPTIONS}
        />
        <FilterSelect
          label="Resale"
          anyLabel="Any"
          value={params.listed}
          onChange={(listed) => setFilter("listed", listed)}
          options={LISTED_OPTIONS}
        />
      </FilterBar>

      <DataTable
        label="Tickets"
        noun="tickets"
        columns={columns}
        query={query}
        params={params}
        onSort={setSort}
        onPage={setPage}
        rowHref={(ticket) => `/tickets/${ticket.id}`}
        mobileRow={(ticket) => <MobileTicket ticket={ticket} />}
        errorTitle="Couldn't load tickets"
        emptyTitle={activeFilterCount ? "No tickets match these filters" : "No tickets yet"}
        emptyHint={
          activeFilterCount
            ? "Search needs the full ticket code or part of an email. Try another event, or loosen the check-in, voided and resale filters."
            : "Tickets appear here once someone buys one."
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
