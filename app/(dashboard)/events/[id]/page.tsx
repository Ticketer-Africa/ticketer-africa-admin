"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DetailHeader } from "@/components/detail-header";
import { EntityLink, entityHref } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { Money } from "@/components/money";
import { RecordActivity } from "@/components/record-activity";
import { RequestBanner } from "@/components/request-banner";
import { SoldBar } from "@/components/sold-bar";
import { StatusBadge } from "@/components/status-badge";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatDate, formatDateTime } from "@/lib/format";
import {
  ACCESS_LABELS,
  bpsToPercent,
  EVENT_CATEGORY_LABELS,
  eventStatus,
  FEE_MODE_LABELS,
  useEvent,
  type AdminEventDetail,
} from "@/services/v2/events";
import { EventActions } from "./event-actions";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useEvent(id);

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-80" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load this event"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  const event = query.data;
  return (
    <div>
      <DetailHeader
        backHref="/events"
        backLabel="Events"
        title={event.name}
        status={<StatusBadge kind="event" value={eventStatus(event)} />}
        subtitle={
          <>
            {EVENT_CATEGORY_LABELS[event.category]} · <span className="num">{formatDateTime(event.date)}</span>
            {event.venueName ? <> · {event.venueName}</> : null}
          </>
        }
        facts={[
          {
            label: "Organizer",
            value: <EntityLink kind="organizer" id={event.organizer.id} label={event.organizer.name} />,
          },
          { label: "Processed", value: <Money value={event.stats.processed} /> },
          {
            label: "Sold",
            value: (
              <span className="num">
                {formatCount(event.stats.ticketsSold)} / {formatCount(event.stats.capacity)}
              </span>
            ),
          },
          { label: "Access", value: ACCESS_LABELS[event.accessType] },
        ]}
        actions={<EventActions event={event} />}
      />

      <RequestBanner targetType="event" targetId={event.id} />

      {event.cancelledAt && (
        <Panel className="mb-5 border-destructive/40 p-4">
          <KeyValues
            items={[
              { label: "Cancelled", value: formatDateTime(event.cancelledAt), mono: true },
              { label: "Why", value: event.cancelReason },
            ]}
          />
        </Panel>
      )}

      {event.latestRefundAll && <RefundAllPanel event={event} />}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          <SalesPanel event={event} />
          <CategoriesPanel event={event} />
          <TransactionsPanel event={event} />
          <RecordActivity targetType="event" targetId={event.id} />
        </div>
        <div className="min-w-0 space-y-5">
          <FeesPanel event={event} />
          <ContentPanel event={event} />
        </div>
      </div>
    </div>
  );
}

function SalesPanel({ event }: { event: AdminEventDetail }) {
  const { stats } = event;
  const anySales = stats.trend.some((d) => d.sold > 0);
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Sales</PanelTitle>
      </PanelHeader>
      <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <KeyValues
          columns={1}
          items={[
            { label: "Average order", value: <Money value={stats.avgOrderValue} /> },
            {
              label: "Checkouts that paid",
              value: <span className="num">{stats.conversionRate}%</span>,
            },
            { label: "Best day", value: stats.peakSalesDay ?? "No sales yet" },
          ]}
        />
        <figure className="min-w-0">
          <figcaption className="mb-2 text-xs text-muted-foreground">Tickets sold, last 7 days</figcaption>
          <div className="flex h-24 items-end gap-1.5" role="img" aria-label={`Tickets sold per day: ${stats.trend.map((d) => `${d.day} ${d.sold}`).join(", ")}`}>
            {stats.trend.map((day) => (
              <div key={day.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="num text-[11px] text-muted-foreground">{day.sold || ""}</span>
                <div
                  className="w-full rounded-sm bg-primary/80"
                  style={{ height: `${anySales ? Math.max(day.heightPct, day.sold ? 4 : 0) : 0}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5" aria-hidden="true">
            {stats.trend.map((day) => (
              <span key={day.day} className="flex-1 text-center text-[11px] text-muted-foreground">
                {day.day}
              </span>
            ))}
          </div>
        </figure>
      </div>
    </Panel>
  );
}

function CategoriesPanel({ event }: { event: AdminEventDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Ticket categories</PanelTitle>
      </PanelHeader>
      {event.ticketCategories.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No ticket categories.</p>
      ) : (
        <ul className="divide-y divide-border">
          {event.ticketCategories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
                <p className="text-xs text-muted-foreground">
                  <Money value={category.price} />
                  {category.maxAdmissions && category.maxAdmissions > 1 ? (
                    <> · admits {formatCount(category.maxAdmissions)}</>
                  ) : null}
                </p>
              </div>
              <SoldBar sold={category.minted} capacity={category.maxTickets} className="w-32 shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function TransactionsPanel({ event }: { event: AdminEventDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Recent payments</PanelTitle>
        <Link
          href={`/transactions?eventId=${event.id}`}
          className="text-sm font-medium text-primary-text underline-offset-4 hover:underline"
        >
          All payments
        </Link>
      </PanelHeader>
      {event.recentTransactions.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No payments yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {event.recentTransactions.slice(0, 10).map((txn) => (
            <li key={txn.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <div className="min-w-0">
                <EntityLink kind="transaction" id={txn.id} label={txn.user.name} className="text-sm" />
                <p className="num truncate text-xs text-muted-foreground">
                  {formatDateTime(txn.createdAt)} · {txn.reference}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge kind="transaction" value={txn.status} />
                <Money value={txn.amount} className="w-24 text-right text-sm" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function FeesPanel({ event }: { event: AdminEventDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Fees</PanelTitle>
      </PanelHeader>
      <div className="p-4">
        <KeyValues
          columns={1}
          items={[
            { label: "Ticket fee", value: bpsToPercent(event.primaryFeeBps), mono: true },
            { label: "Who pays it", value: FEE_MODE_LABELS[event.feeMode] },
            { label: "Resale fee", value: bpsToPercent(event.resaleFeeBps), mono: true },
            { label: "Organizer royalty on resales", value: bpsToPercent(event.royaltyFeeBps), mono: true },
          ]}
        />
      </div>
    </Panel>
  );
}

function ContentPanel({ event }: { event: AdminEventDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Details</PanelTitle>
      </PanelHeader>
      <div className="space-y-4 p-4">
        <KeyValues
          columns={1}
          items={[
            { label: "Venue", value: event.venueName, hidden: !event.venueName },
            { label: "Address", value: event.venueAddress, hidden: !event.venueAddress },
            { label: "Doors open", value: formatDateTime(event.doorsOpenAt), mono: true, hidden: !event.doorsOpenAt },
            { label: "Online", value: "Yes", hidden: !event.isVirtual },
            { label: "Created", value: formatDate(event.createdAt), mono: true },
            { label: "Slug", value: event.slug, mono: true },
          ]}
        />
        {event.description && (
          <div className="space-y-1">
            <h3 className="text-xs text-muted-foreground">Description</h3>
            <p className="line-clamp-6 whitespace-pre-line text-sm text-foreground">{event.description}</p>
          </div>
        )}
        {event.lineup.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs text-muted-foreground">Lineup</h3>
            <p className="text-sm text-foreground">{event.lineup.map((artist) => artist.name).join(", ")}</p>
          </div>
        )}
        {(event.faq.length > 0 || event.goodToKnow.length > 0) && (
          <p className="text-xs text-muted-foreground">
            {formatCount(event.faq.length)} FAQ · {formatCount(event.goodToKnow.length)} good-to-know points
          </p>
        )}
      </div>
    </Panel>
  );
}

function RefundAllPanel({ event }: { event: AdminEventDetail }) {
  const request = event.latestRefundAll!;
  const result = request.result;
  return (
    <Panel className="mb-5">
      <PanelHeader>
        <PanelTitle className="flex items-center gap-2">
          Refund all buyers <StatusBadge kind="request" value={request.status} />
        </PanelTitle>
        <Link
          href={entityHref("request", request.id)}
          className="text-sm font-medium text-primary-text underline-offset-4 hover:underline"
        >
          Open request
        </Link>
      </PanelHeader>
      <div className="space-y-3 p-4">
        <p className="text-sm text-foreground">{request.summary}</p>
        {result ? (
          <>
            <KeyValues
              columns={2}
              items={[
                { label: "Refunds to run", value: formatCount(result.queued), mono: true },
                { label: "Completed", value: formatCount(result.completed), mono: true },
                { label: "Sent, waiting on Korapay", value: formatCount(result.initiated), mono: true, hidden: !result.initiated },
                { label: "Failed", value: formatCount(result.failed.length), mono: true },
                { label: "Still in the queue", value: formatCount(result.unaccounted), mono: true, hidden: !result.unaccounted },
              ]}
            />
            {result.failed.length > 0 && (
              <ul className="space-y-1 border-t border-border pt-3 text-sm">
                {result.failed.slice(0, 20).map((failure) => (
                  <li key={failure.transactionId} className="flex flex-wrap gap-x-2">
                    <EntityLink kind="transaction" id={failure.transactionId} label={failure.reference} mono className="text-xs" />
                    <span className="text-muted-foreground">{failure.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing has run yet.</p>
        )}
      </div>
    </Panel>
  );
}
