"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { EventFilter } from "@/components/data-table/event-filter";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { DateRangePicker } from "@/components/date-range-picker";
import { ExportButton } from "@/components/export-button";
import { Money } from "@/components/money";
import { SoldBar } from "@/components/sold-bar";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import {
  ACCESS_LABELS,
  EVENT_CATEGORY_LABELS,
  eventStatus,
  useEvents,
  type AdminEventRow,
} from "@/services/v2/events";

const DEFAULTS = defineListDefaults({
  filters: {
    q: undefined,
    status: undefined,
    category: undefined,
    organizerId: undefined,
    accessType: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  },
  sort: "date",
  order: "desc",
});

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "active", label: "On sale" },
  { value: "inactive", label: "Switched off" },
  { value: "cancelled", label: "Cancelled" },
];

const CATEGORY_OPTIONS = Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const ACCESS_OPTIONS = Object.entries(ACCESS_LABELS).map(([value, label]) => ({ value, label }));

const columns: ColumnDef<AdminEventRow, unknown>[] = [
  {
    id: "name",
    header: "Event",
    meta: { sortKey: "name", className: "max-w-[18rem]" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="block truncate font-medium text-foreground" title={row.original.name}>
          {row.original.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground" title={row.original.organizer.name}>
          {row.original.organizer.name}
        </span>
      </div>
    ),
  },
  {
    id: "date",
    header: "Date",
    meta: { sortKey: "date" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">
        {formatDate(row.original.date)}
      </span>
    ),
  },
  {
    id: "category",
    header: "Category",
    meta: { hideBelow: "xl" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{EVENT_CATEGORY_LABELS[row.original.category]}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge kind="event" value={eventStatus(row.original)} />,
  },
  {
    id: "sold",
    header: "Sold",
    meta: { hideBelow: "lg" },
    cell: ({ row }) => <SoldBar sold={row.original.ticketsSold} capacity={row.original.capacity} />,
  },
  {
    id: "processed",
    header: "Processed",
    meta: { sortKey: "processed", align: "right" },
    cell: ({ row }) => <Money value={row.original.processed} />,
  },
];

function MobileEvent({ event }: { event: AdminEventRow }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 truncate font-medium text-foreground" title={event.name}>
          {event.name}
        </span>
        <StatusBadge kind="event" value={eventStatus(event)} />
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{event.organizer.name}</span>
        <span aria-hidden="true">·</span>
        <span className="num">{formatDate(event.date)}</span>
      </p>
      <div className="flex items-center justify-between gap-3">
        <SoldBar sold={event.ticketsSold} capacity={event.capacity} className="min-w-0 flex-1" />
        <Money value={event.processed} className="text-sm text-foreground" />
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { params, setFilter, setFilters, setSort, setPage, reset, activeFilterCount } =
    useListParams(DEFAULTS);
  const query = useEvents(params);

  return (
    <div>
      <PageHeader
        title="Events"
        description="Every event on Ticketer Africa: what's on sale, how it's selling, and what each has processed."
        actions={<ExportButton path="/events/export" params={params} filename="events" />}
      />

      <FilterBar
        search={{
          value: params.q,
          onChange: (q) => setFilter("q", q),
          placeholder: "Search events by name",
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
          label="Category"
          anyLabel="Any category"
          value={params.category}
          onChange={(category) => setFilter("category", category)}
          options={CATEGORY_OPTIONS}
        />
        <EventFilter
          kind="organizer"
          value={params.organizerId}
          onChange={(organizerId) => setFilter("organizerId", organizerId)}
        />
        <FilterSelect
          label="Access"
          anyLabel="Anyone"
          value={params.accessType}
          onChange={(accessType) => setFilter("accessType", accessType)}
          options={ACCESS_OPTIONS}
        />
        <DateRangePicker
          label="Event date"
          value={{ from: params.dateFrom, to: params.dateTo }}
          onChange={(range) => setFilters({ dateFrom: range.from, dateTo: range.to })}
        />
      </FilterBar>

      <DataTable
        label="Events"
        noun="events"
        columns={columns}
        query={query}
        params={params}
        onSort={setSort}
        onPage={setPage}
        rowHref={(event) => `/events/${event.id}`}
        mobileRow={(event) => <MobileEvent event={event} />}
        errorTitle="Couldn't load events"
        emptyTitle={activeFilterCount ? "No events match these filters" : "No events yet"}
        emptyHint={
          activeFilterCount
            ? "Try another status, category or organizer, or a wider date range."
            : "Events show up here as soon as an organizer creates one."
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
