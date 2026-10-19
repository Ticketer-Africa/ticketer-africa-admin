"use client";

import { useParams } from "next/navigation";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { CopyButton } from "@/components/copy-button";
import { DetailHeader } from "@/components/detail-header";
import { EntityLink } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { LedgerEntries } from "@/components/ledger-entries";
import { Money } from "@/components/money";
import { RecordActivity } from "@/components/record-activity";
import { StatusBadge } from "@/components/status-badge";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { auditKey } from "@/services/v2/audit";
import {
  providerStatusLabel,
  recheckRefund,
  REFUND_MODE_LABELS,
  refundsKey,
  useRefund,
  type AdminRefundDetail,
} from "@/services/v2/refunds";
import { TRANSACTION_TYPE_LABELS, transactionsKey } from "@/services/v2/transactions";

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useRefund(id);

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-64" />
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
        title="Couldn't load this refund"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  const refund = query.data;
  const txn = refund.transaction;
  const open = refund.status === "PENDING" || refund.status === "PROCESSING";

  return (
    <div>
      <DetailHeader
        backHref="/refunds"
        backLabel="Refunds"
        title={
          <>
            Refund of <Money value={refund.amount} />
          </>
        }
        status={<StatusBadge kind="refund" value={refund.status} />}
        subtitle={txn ? <>to <span className="num">{txn.user.email}</span></> : "Transaction not found"}
        facts={[
          ...(txn?.event
            ? [{ label: "Event", value: <EntityLink kind="event" id={txn.event.id} label={txn.event.name} /> }]
            : []),
          { label: "Mode", value: REFUND_MODE_LABELS[refund.mode] },
          { label: "Started", value: <span className="num">{formatDateTime(refund.createdAt)}</span> },
          ...(refund.completedAt
            ? [{ label: "Completed", value: <span className="num">{formatDateTime(refund.completedAt)}</span> }]
            : []),
        ]}
        actions={
          <InlineConfirm
            key="recheck"
            available={refund.mode === "KORAPAY" && open}
            label="Re-check with Korapay"
            message="Ask Korapay where this refund stands? Only a clear success or failure from Korapay changes it."
            confirmLabel="Re-check"
            invalidate={[refundsKey, transactionsKey, auditKey]}
            onConfirm={() => recheckRefund(refund.id)}
            successMessage={(result) =>
              result.refundStatus === "COMPLETED"
                ? "Korapay paid it: refund completed"
                : result.refundStatus === "FAILED"
                  ? "Korapay says it failed: the reversals were restored"
                  : `No change: ${providerStatusLabel(result.providerStatus)}`
            }
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          <AmountsPanel refund={refund} />
          <Panel>
            <PanelHeader>
              <PanelTitle>Reversals</PanelTitle>
            </PanelHeader>
            <div className="p-4">
              <LedgerEntries
                entries={refund.ledger}
                emptyText={
                  refund.status === "FAILED"
                    ? "Nothing was reversed, or the reversals were restored."
                    : "Nothing has been reversed yet."
                }
              />
            </div>
          </Panel>
          <RecordActivity targetType="refund" targetId={refund.id} />
        </div>
        <div className="min-w-0 space-y-5">
          <ProviderPanel refund={refund} />
          <TransactionPanel refund={refund} />
          <RequestPanel refund={refund} />
        </div>
      </div>
    </div>
  );
}

function AmountsPanel({ refund }: { refund: AdminRefundDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Amounts</PanelTitle>
      </PanelHeader>
      <dl className="space-y-2 p-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">To the buyer</dt>
          <dd className="shrink-0 font-semibold text-foreground">
            <Money value={refund.amount} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Reversed from the organizer</dt>
          <dd className="shrink-0 text-foreground">
            <Money value={refund.organizerDebit} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="min-w-0 text-muted-foreground">
            Reversed from the platform
            {refund.platformCoveredOrganizerShare && (
              <span className="block text-xs">Includes the organizer&apos;s share: their wallet was short.</span>
            )}
          </dt>
          <dd className="shrink-0 text-foreground">
            <Money value={refund.platformDebit} />
          </dd>
        </div>
      </dl>
      {refund.status === "FAILED" && (
        <p className="px-4 pb-3 text-xs text-muted-foreground">
          The refund failed, so whatever was reversed has been put back in the wallets (see
          Reversals).
        </p>
      )}
      <div className="border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">Reason</p>
        <p className="mt-0.5 break-words text-sm text-foreground">{refund.reason}</p>
      </div>
    </Panel>
  );
}

function ProviderPanel({ refund }: { refund: AdminRefundDetail }) {
  const provider = providerStatusLabel(refund.providerStatus);
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{refund.mode === "KORAPAY" ? "Korapay" : "How it was paid"}</PanelTitle>
      </PanelHeader>
      <div className="p-4">
        <KeyValues
          columns={1}
          items={[
            {
              label: "Mode",
              value:
                refund.mode === "KORAPAY"
                  ? "Korapay, back to the buyer's card or account"
                  : "Manual, sent outside Korapay",
            },
            {
              label: "Korapay status",
              value: provider ?? "Not sent yet",
              hidden: refund.mode !== "KORAPAY",
            },
            {
              label: "Korapay reference",
              value: (
                <span className="inline-flex items-center gap-1">
                  <span className="break-all">{refund.reference}</span>
                  <CopyButton value={refund.reference} what="Korapay reference" />
                </span>
              ),
              mono: true,
              hidden: refund.mode !== "KORAPAY",
            },
            {
              label: "Why it failed",
              value: <span className="text-destructive">{refund.failureReason}</span>,
              hidden: !refund.failureReason,
            },
            { label: "Last change", value: formatDateTime(refund.updatedAt), mono: true },
          ]}
        />
      </div>
    </Panel>
  );
}

function TransactionPanel({ refund }: { refund: AdminRefundDetail }) {
  const txn = refund.transaction;
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Transaction</PanelTitle>
        {txn && <StatusBadge kind="transaction" value={txn.status} />}
      </PanelHeader>
      <div className="p-4">
        {txn ? (
          <KeyValues
            columns={1}
            items={[
              {
                label: "Reference",
                value: <EntityLink kind="transaction" id={txn.id} label={txn.reference} mono />,
              },
              { label: "Type", value: TRANSACTION_TYPE_LABELS[txn.type] },
              { label: "Paid", value: <Money value={txn.amount} /> },
              { label: "Buyer", value: <EntityLink kind="user" id={txn.user.id} label={txn.user.name} /> },
              { label: "Email", value: <span className="break-all">{txn.user.email}</span>, mono: true },
              {
                label: "Event",
                value: txn.event ? (
                  <>
                    <EntityLink kind="event" id={txn.event.id} label={txn.event.name} />
                    {txn.event.cancelledAt && <span className="text-muted-foreground"> · cancelled</span>}
                  </>
                ) : null,
              },
              { label: "Bought", value: formatDateTime(txn.createdAt), mono: true },
            ]}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            The transaction <span className="num">{refund.transactionId}</span> no longer exists.
          </p>
        )}
      </div>
    </Panel>
  );
}

function RequestPanel({ refund }: { refund: AdminRefundDetail }) {
  const request = refund.request;
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Approval</PanelTitle>
        {request && <StatusBadge kind="request" value={request.status} />}
      </PanelHeader>
      <div className="p-4">
        {request ? (
          <KeyValues
            columns={1}
            items={[
              { label: "Request", value: <EntityLink kind="request" id={request.id} label="View request" /> },
              { label: "Asked by", value: request.requestedBy.name },
              { label: "Why", value: request.requestReason },
              {
                label: request.selfApproved ? "Approved by (their own request)" : "Decided by",
                value: request.decidedBy?.name,
                hidden: !request.decidedBy,
              },
              { label: "Decided", value: formatDateTime(request.decidedAt), mono: true, hidden: !request.decidedAt },
              { label: "Failure", value: request.failureReason, hidden: !request.failureReason },
            ]}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No approval request is linked to this refund.</p>
        )}
      </div>
    </Panel>
  );
}
