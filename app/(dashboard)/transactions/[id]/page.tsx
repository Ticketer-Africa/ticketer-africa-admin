"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { DetailHeader } from "@/components/detail-header";
import { EntityLink, entityHref } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { LedgerEntries } from "@/components/ledger-entries";
import { Money } from "@/components/money";
import { RecordActivity } from "@/components/record-activity";
import { RequestBanner } from "@/components/request-banner";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatDate, formatDateTime } from "@/lib/format";
import {
  providerStatusLabel,
  REFUND_MODE_LABELS as MODE_LABELS,
  useRefund,
  type RefundRecord,
} from "@/services/v2/refunds";
import {
  TRANSACTION_TYPE_LABELS,
  useTransaction,
  type AdminTransactionDetail,
} from "@/services/v2/transactions";
import { TransactionActions } from "./transaction-actions";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useTransaction(id);

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
        title="Couldn't load this transaction"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  const txn = query.data;
  return (
    <div>
      <DetailHeader
        backHref="/transactions"
        backLabel="Transactions"
        title={<span className="num text-xl md:text-2xl">{txn.reference}</span>}
        status={
          <>
            <CopyButton value={txn.reference} what="reference" className="-ml-2" />
            <StatusBadge kind="transaction" value={txn.status} />
          </>
        }
        subtitle={
          <>
            {TRANSACTION_TYPE_LABELS[txn.type]} · <span className="num">{formatDateTime(txn.createdAt)}</span>
          </>
        }
        facts={[
          { label: "Amount", value: <Money value={txn.amount} /> },
          { label: "Buyer", value: <EntityLink kind="user" id={txn.user.id} label={txn.user.name} /> },
          ...(txn.event
            ? [{ label: "Event", value: <EntityLink kind="event" id={txn.event.id} label={txn.event.name} /> }]
            : []),
          ...(txn.tickets.length
            ? [{ label: "Tickets", value: <span className="num">{formatCount(txn.tickets.length)}</span> }]
            : []),
        ]}
        actions={<TransactionActions txn={txn} />}
      />

      <RequestBanner targetType="transaction" targetId={txn.id} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          {txn.refund && <RefundPanel refund={txn.refund} />}
          <TicketsPanel txn={txn} />
          <LedgerPanel txn={txn} />
          <RecordActivity targetType="transaction" targetId={txn.id} />
        </div>
        <div className="min-w-0 space-y-5">
          <PaymentPanel txn={txn} />
          <PeoplePanel txn={txn} />
        </div>
      </div>
    </div>
  );
}

function PaymentPanel({ txn }: { txn: AdminTransactionDetail }) {
  const rows: { label: string; value: ReactNode; hidden?: boolean }[] = [
    { label: "Ticket price", value: <Money value={txn.baseAmount} />, hidden: txn.baseAmount === null },
    {
      label: txn.discountCode ? `Discount (${txn.discountCode.code})` : "Discount",
      value: <Money value={txn.discountAmount ? -txn.discountAmount : 0} />,
      hidden: !txn.discountAmount,
    },
    {
      label: "Fees paid by buyer",
      value: txn.feeAmount === null ? <span className="text-muted-foreground">Not recorded</span> : <Money value={txn.feeAmount} />,
    },
  ];
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Payment</PanelTitle>
      </PanelHeader>
      <dl className="space-y-2 p-4 text-sm">
        {rows
          .filter((row) => !row.hidden)
          .map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="min-w-0 text-muted-foreground">{row.label}</dt>
              <dd className="shrink-0 text-foreground">{row.value}</dd>
            </div>
          ))}
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
          <dt className="font-medium text-foreground">Total paid</dt>
          <dd className="shrink-0 font-semibold text-foreground">
            <Money value={txn.amount} />
          </dd>
        </div>
      </dl>
    </Panel>
  );
}

function PeoplePanel({ txn }: { txn: AdminTransactionDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Buyer and event</PanelTitle>
      </PanelHeader>
      <div className="p-4">
        <KeyValues
          columns={1}
          items={[
            { label: "Buyer", value: <EntityLink kind="user" id={txn.user.id} label={txn.user.name} /> },
            { label: "Email", value: <span className="break-all">{txn.user.email}</span>, mono: true },
            {
              label: "Event",
              value: txn.event ? <EntityLink kind="event" id={txn.event.id} label={txn.event.name} /> : null,
            },
            {
              label: "Event date",
              value: txn.event ? formatDate(txn.event.date) : null,
              mono: true,
              hidden: !txn.event,
            },
            { label: "Last updated", value: formatDateTime(txn.updatedAt), mono: true },
          ]}
        />
      </div>
    </Panel>
  );
}

function TicketsPanel({ txn }: { txn: AdminTransactionDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Tickets</PanelTitle>
      </PanelHeader>
      {txn.tickets.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          {txn.status === "PENDING" || txn.status === "FAILED"
            ? "Tickets are issued once the payment succeeds."
            : "No tickets on this transaction."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {txn.tickets.map((ticket) => {
            const recipient =
              ticket.recipientEmail && ticket.recipientEmail !== txn.user.email
                ? (ticket.recipientName ? `${ticket.recipientName} · ` : "") + ticket.recipientEmail
                : null;
            return (
              <li key={ticket.id} className="flex items-start justify-between gap-4 px-4 py-2.5">
                <div className="min-w-0 space-y-0.5">
                  <EntityLink kind="ticket" id={ticket.id} label={ticket.code} mono className="text-sm" />
                  <p className="truncate text-xs text-muted-foreground">
                    {ticket.ticketCategory?.name ?? "No category"}
                    {recipient && <> · for {recipient}</>}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {ticket.voidedAt ? (
                    <Badge variant="destructive" dot title={`Voided ${formatDateTime(ticket.voidedAt)}`}>
                      Voided
                    </Badge>
                  ) : ticket.isUsed ? (
                    <Badge variant="neutral" dot>
                      Checked in
                    </Badge>
                  ) : (
                    <Badge variant="success" dot>
                      Valid
                    </Badge>
                  )}
                  {ticket.isListed && !ticket.voidedAt && <Badge variant="info">Listed for resale</Badge>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function LedgerPanel({ txn }: { txn: AdminTransactionDetail }) {
  // Reversals are keyed by the refund (refund:<id>:…), so they come from it.
  const refund = useRefund(txn.refund?.id);
  const reversals = refund.data?.ledger ?? [];
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Who got what</PanelTitle>
      </PanelHeader>
      <div className="space-y-4 p-4">
        <LedgerEntries
          entries={txn.ledger}
          emptyText={
            txn.status === "SUCCESS" || txn.status === "REFUNDED"
              ? "No wallet entries for this payment (it predates the ledger)."
              : "Nothing is credited until the payment succeeds."
          }
        />
        {txn.refund && (
          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground">Refund reversals</h3>
            {refund.isPending ? (
              <Skeleton className="h-10 w-full" />
            ) : refund.isError ? (
              <ErrorState
                title="Couldn't load the reversals"
                error={refund.error}
                onRetry={() => void refund.refetch()}
                className="py-4"
              />
            ) : (
              <LedgerEntries entries={reversals} emptyText="Nothing has been reversed yet." />
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

function RefundPanel({ refund }: { refund: RefundRecord }) {
  const failed = refund.status === "FAILED";
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle className="flex items-center gap-2">
          Refund <StatusBadge kind="refund" value={refund.status} />
        </PanelTitle>
        <Link
          href={entityHref("refund", refund.id)}
          className="text-sm font-medium text-primary-text underline-offset-4 hover:underline"
        >
          Open refund
        </Link>
      </PanelHeader>
      <div className="p-4">
        <KeyValues
          items={[
            { label: "To the buyer", value: <Money value={refund.amount} /> },
            { label: "Mode", value: MODE_LABELS[refund.mode] },
            {
              label: failed ? "Was taken from the organizer (put back)" : "From the organizer",
              value: <Money value={refund.organizerDebit} />,
            },
            {
              label: failed ? "Was taken from the platform (put back)" : "From the platform",
              value: (
                <>
                  <Money value={refund.platformDebit} />
                  {refund.platformCoveredOrganizerShare && (
                    <span className="text-muted-foreground"> · covered the organizer&apos;s share</span>
                  )}
                </>
              ),
            },
            {
              label: "Korapay status",
              value: providerStatusLabel(refund.providerStatus) ?? "Not sent yet",
              hidden: refund.mode !== "KORAPAY",
            },
            { label: "Why it failed", value: refund.failureReason, hidden: !refund.failureReason },
            { label: "Started", value: formatDateTime(refund.createdAt), mono: true },
            {
              label: "Completed",
              value: formatDateTime(refund.completedAt),
              mono: true,
              hidden: !refund.completedAt,
            },
            {
              label: "Approval request",
              value: refund.approvalRequestId ? (
                <EntityLink kind="request" id={refund.approvalRequestId} label="View request" />
              ) : null,
              hidden: !refund.approvalRequestId,
            },
            { label: "Reason", value: refund.reason },
          ]}
        />
      </div>
    </Panel>
  );
}
