"use client";

import { useParams } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { DetailHeader } from "@/components/detail-header";
import { EntityLink } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { Money } from "@/components/money";
import { RecordActivity } from "@/components/record-activity";
import { RequestBanner } from "@/components/request-banner";
import { StatusBadge } from "@/components/status-badge";
import { TicketBadges } from "@/components/ticket-badges";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatDate, formatDateTime } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/services/v2/transactions";
import { useTicket, type AdminTicketDetail } from "@/services/v2/tickets";
import { TicketActions } from "./ticket-actions";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useTicket(id);

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load this ticket"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  const ticket = query.data;
  const resold = ticket.resale.resaleCount > 0 || ticket.resale.isListed;
  return (
    <div>
      <DetailHeader
        backHref="/tickets"
        backLabel="Tickets"
        title={<span className="num text-xl md:text-2xl">{ticket.code}</span>}
        status={
          <>
            <CopyButton value={ticket.code} what="ticket code" className="-ml-2" />
            <TicketBadges {...ticket} />
          </>
        }
        subtitle={
          <>
            Issued <span className="num">{formatDateTime(ticket.createdAt)}</span>
          </>
        }
        facts={[
          { label: "Owner", value: <EntityLink kind="user" id={ticket.owner.id} label={ticket.owner.name} /> },
          { label: "Event", value: <EntityLink kind="event" id={ticket.event.id} label={ticket.event.name} /> },
          ...(ticket.category ? [{ label: "Category", value: ticket.category.name }] : []),
        ]}
        actions={<TicketActions ticket={ticket} />}
      />

      <RequestBanner targetType="ticket" targetId={ticket.id} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          <ScansPanel ticket={ticket} />
          <TransactionsPanel ticket={ticket} />
          <RecordActivity targetType="ticket" targetId={ticket.id} />
        </div>
        <div className="min-w-0 space-y-5">
          <TicketPanel ticket={ticket} />
          {resold && <ResalePanel ticket={ticket} />}
        </div>
      </div>
    </div>
  );
}

function TicketPanel({ ticket }: { ticket: AdminTicketDetail }) {
  const recipient =
    ticket.recipientEmail && ticket.recipientEmail !== ticket.owner.email ? ticket.recipientEmail : null;
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Ticket</PanelTitle>
      </PanelHeader>
      <div className="p-4">
        <KeyValues
          columns={1}
          items={[
            { label: "Owner", value: <EntityLink kind="user" id={ticket.owner.id} label={ticket.owner.name} /> },
            { label: "Owner email", value: <span className="break-all">{ticket.owner.email}</span>, mono: true },
            {
              label: "Bought for",
              value: (
                <span className="break-all">
                  {ticket.recipientName ? `${ticket.recipientName} · ` : ""}
                  {recipient}
                </span>
              ),
              mono: true,
              hidden: !recipient,
            },
            { label: "Event", value: <EntityLink kind="event" id={ticket.event.id} label={ticket.event.name} /> },
            { label: "Event date", value: formatDate(ticket.occurrence?.startsAt ?? ticket.event.date), mono: true },
            {
              label: "Category",
              value: ticket.category ? (
                <>
                  {ticket.category.name} · <Money value={ticket.category.price} />
                </>
              ) : null,
            },
            {
              label: ticket.voidReason === "refunded" ? "Voided (refunded)" : "Voided",
              value: formatDateTime(ticket.voidedAt),
              mono: true,
              hidden: !ticket.voidedAt,
            },
            {
              label: "Virtual link sent",
              value: formatDateTime(ticket.virtualLinkSentAt),
              mono: true,
              hidden: !ticket.virtualLinkSentAt,
            },
          ]}
        />
      </div>
    </Panel>
  );
}

function ScansPanel({ ticket }: { ticket: AdminTicketDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Scans</PanelTitle>
        {ticket.scans.length > 0 && (
          <span className="num text-sm text-muted-foreground">{formatCount(ticket.scans.length)}</span>
        )}
      </PanelHeader>
      {ticket.scans.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          {ticket.voidedAt
            ? "Never scanned. A voided ticket can't be scanned."
            : ticket.isUsed
              ? "Marked as used, but no scan is recorded (it was checked in before scans were kept)."
              : "Not scanned yet."}
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {ticket.scans.map((scan, index) => (
            <li key={scan.id} className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="text-muted-foreground">Scan {index + 1}</span>
                <span className="block truncate text-foreground">
                  {scan.scanner ? (
                    <>
                      by {scan.scanner.name}
                      <span className="num text-xs text-muted-foreground"> · {scan.scanner.email}</span>
                    </>
                  ) : (
                    "Scanner unknown"
                  )}
                </span>
              </span>
              <span className="num shrink-0 text-xs text-muted-foreground">{formatDateTime(scan.scannedAt)}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function TransactionsPanel({ ticket }: { ticket: AdminTicketDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Payments</PanelTitle>
      </PanelHeader>
      {ticket.transactions.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No payment is linked to this ticket.</p>
      ) : (
        <ul className="divide-y divide-border">
          {ticket.transactions.map((txn) => (
            <li key={txn.id} className="flex items-start justify-between gap-4 px-4 py-2.5">
              <div className="min-w-0 space-y-0.5">
                <EntityLink kind="transaction" id={txn.id} label={txn.reference} mono className="text-sm" />
                <p className="truncate text-xs text-muted-foreground">
                  {TRANSACTION_TYPE_LABELS[txn.type]} · {txn.user.name} ·{" "}
                  <span className="num">{formatDateTime(txn.createdAt)}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Money value={txn.amount} className="text-sm" />
                <StatusBadge kind="transaction" value={txn.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ResalePanel({ ticket }: { ticket: AdminTicketDetail }) {
  const { resale } = ticket;
  const buyer = resale.soldTo;
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Resale</PanelTitle>
      </PanelHeader>
      <div className="p-4">
        <KeyValues
          columns={1}
          items={[
            { label: "Listed now", value: resale.isListed ? "Yes" : "No" },
            { label: "Asking price", value: <Money value={resale.resalePrice} />, hidden: resale.resalePrice === null },
            { label: "Listed", value: formatDateTime(resale.listedAt), mono: true, hidden: !resale.listedAt },
            { label: "Times resold", value: formatCount(resale.resaleCount), mono: true },
            {
              label: "Last sold to",
              value: buyer ? (
                <EntityLink kind="user" id={buyer.id} label={buyer.name ?? buyer.email ?? buyer.id} />
              ) : null,
              hidden: !buyer,
            },
          ]}
        />
      </div>
    </Panel>
  );
}
