"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { EventFilter } from "@/components/data-table/event-filter";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { EntityLink } from "@/components/entity-link";
import { Money } from "@/components/money";
import { formatCount, formatDate } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { useDiscounts, type AdminDiscountRow } from "@/services/v2/discounts";
import { CreatePromoSheet } from "./create-promo-sheet";
import { PromoRowActions } from "./promo-row-actions";

const DEFAULTS = defineListDefaults({
  filters: { q: undefined, eventId: undefined, active: undefined },
  sort: "createdAt",
  order: "desc",
});

const ACTIVE_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Disabled" },
];

function DiscountValue({ discount }: { discount: AdminDiscountRow }) {
  return discount.type === "PERCENT" ? (
    <span className="num whitespace-nowrap">{discount.valuePercent}% off</span>
  ) : (
    <span className="whitespace-nowrap">
      <Money value={discount.valueAmount} /> off
    </span>
  );
}

function Usage({ discount }: { discount: AdminDiscountRow }) {
  return (
    <span className="num whitespace-nowrap">
      {formatCount(discount.usedCount)}
      <span className="text-muted-foreground">
        {discount.usageLimit === null ? " · no limit" : ` of ${formatCount(discount.usageLimit)}`}
      </span>
    </span>
  );
}

/** Disabled beats used up beats active; always a word, not just a colour. */
function PromoStatus({ discount }: { discount: AdminDiscountRow }) {
  if (discount.disabledAt) {
    return (
      <Badge variant="neutral" dot title={`Disabled ${formatDate(discount.disabledAt)}`}>
        Disabled
      </Badge>
    );
  }
  if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
    return (
      <Badge variant="warning" dot>
        Used up
      </Badge>
    );
  }
  return (
    <Badge variant="success" dot>
      Active
    </Badge>
  );
}

const columns: ColumnDef<AdminDiscountRow, unknown>[] = [
  {
    id: "code",
    header: "Code",
    cell: ({ row }) => (
      <div className="space-y-1">
        <span className="num block whitespace-nowrap text-sm font-medium">{row.original.code}</span>
        {/* The Status column is hidden below xl so the row actions fit. */}
        <div className="xl:hidden">
          <PromoStatus discount={row.original} />
        </div>
      </div>
    ),
  },
  {
    id: "event",
    header: "Event",
    meta: { className: "max-w-[12rem]" },
    cell: ({ row }) => (
      <EntityLink kind="event" id={row.original.event.id} label={row.original.event.name} />
    ),
  },
  {
    id: "discount",
    header: "Discount",
    cell: ({ row }) => <DiscountValue discount={row.original} />,
  },
  {
    id: "usedCount",
    header: "Used",
    meta: { sortKey: "usedCount" },
    cell: ({ row }) => <Usage discount={row.original} />,
  },
  {
    id: "status",
    header: "Status",
    meta: { hideBelow: "xl" },
    cell: ({ row }) => <PromoStatus discount={row.original} />,
  },
  {
    id: "createdAt",
    header: "Created",
    meta: { sortKey: "createdAt", hideBelow: "xl" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    meta: { align: "right" },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <PromoRowActions discount={row.original} />
      </div>
    ),
  },
];

function MobilePromo({ discount }: { discount: AdminDiscountRow }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="num text-sm font-medium text-foreground">{discount.code}</span>
        <PromoStatus discount={discount} />
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-foreground">
        <DiscountValue discount={discount} />
        <span aria-hidden="true" className="text-muted-foreground">
          ·
        </span>
        <span>
          <span className="text-muted-foreground">Used </span>
          <Usage discount={discount} />
        </span>
      </p>
      <p className="min-w-0 truncate text-xs text-muted-foreground">
        <EntityLink kind="event" id={discount.event.id} label={discount.event.name} />
      </p>
      <PromoRowActions discount={discount} />
    </div>
  );
}

export default function PromoCodesPage() {
  const { params, setFilter, setSort, setPage, reset, activeFilterCount } = useListParams(DEFAULTS);
  const query = useDiscounts(params);

  return (
    <div>
      <PageHeader
        title="Promo codes"
        description="Discount codes across all events, their limits and how often they've been used."
        actions={<CreatePromoSheet />}
      />

      <FilterBar
        search={{
          value: params.q,
          onChange: (q) => setFilter("q", q),
          placeholder: "Search by code",
        }}
        activeCount={activeFilterCount}
        onClear={reset}
      >
        <EventFilter value={params.eventId} onChange={(eventId) => setFilter("eventId", eventId)} />
        <FilterSelect
          label="Status"
          anyLabel="Any status"
          value={params.active}
          onChange={(active) => setFilter("active", active)}
          options={ACTIVE_OPTIONS}
        />
      </FilterBar>

      <DataTable
        label="Promo codes"
        noun="promo codes"
        columns={columns}
        query={query}
        params={params}
        onSort={setSort}
        onPage={setPage}
        mobileRow={(discount) => <MobilePromo discount={discount} />}
        errorTitle="Couldn't load promo codes"
        emptyTitle={activeFilterCount ? "No promo codes match these filters" : "No promo codes yet"}
        emptyHint={
          activeFilterCount
            ? "Try part of the code, another event, or any status."
            : "Create one for an event and buyers can enter it at checkout."
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
