"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ActionSheet } from "@/components/actions/action-sheet";
import { ActionsMenu, type ActionsMenuItem } from "@/components/actions/actions-menu";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { CopyButton } from "@/components/copy-button";
import { DetailHeader } from "@/components/detail-header";
import { EntityLink } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { Money } from "@/components/money";
import { RecordActivity } from "@/components/record-activity";
import { RequestBanner } from "@/components/request-banner";
import { StatusBadge } from "@/components/status-badge";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { auditKey } from "@/services/v2/audit";
import { useMe } from "@/services/v2/me";
import {
  canForceFail,
  payoutsKey,
  PROVIDER_LABELS,
  recheckPayout,
  usePayout,
  type AdminPayoutDetail,
  type PayoutHistoryEntry,
} from "@/services/v2/payouts";
import { createAndMaybeSelfApprove } from "@/services/v2/requests";

/** Payout audit actions in plain words. */
const HISTORY_LABELS: Record<string, string> = {
  PAYOUT_CREATED: "Requested",
  PAYOUT_DISPATCHED: "Sent to the provider",
  PAYOUT_DISPATCH_UNKNOWN: "Sent, but the provider's answer was unclear",
  PAYOUT_SETTLED: "Settled by the provider",
  PAYOUT_FAILED: "Failed",
  PAYOUT_FAILED_REFUNDED: "Failed; money returned to the wallet",
  RESALE_SETTLEMENT_DISPATCH_FAILED: "Settlement couldn't be sent",
};

export default function PayoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = usePayout(id);

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load this payout"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  const payout = query.data;
  return (
    <div>
      <DetailHeader
        backHref="/payouts"
        backLabel="Payouts"
        title={<span className="num text-xl md:text-2xl">{payout.reference}</span>}
        status={
          <>
            <CopyButton value={payout.reference} what="reference" className="-ml-2" />
            <StatusBadge kind="payout" value={payout.status} />
          </>
        }
        subtitle={
          <>
            {payout.walletBacked ? "Wallet withdrawal" : "Resale settlement"} · {PROVIDER_LABELS[payout.provider]} ·{" "}
            <span className="num">{formatDateTime(payout.createdAt)}</span>
          </>
        }
        facts={[
          { label: "Amount", value: <Money value={payout.amount} /> },
          { label: "To", value: <EntityLink kind="user" id={payout.user.id} label={payout.user.name} /> },
          {
            label: "Bank",
            value: (
              <span>
                {payout.destination.bankName ?? "Bank"}
                {payout.destination.accountLast4 && <span className="num"> •••• {payout.destination.accountLast4}</span>}
              </span>
            ),
          },
        ]}
        actions={<PayoutActions payout={payout} />}
      />

      <RequestBanner targetType="payout" targetId={payout.id} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          <HistoryPanel history={payout.history} />
          <RecordActivity targetType="payout" targetId={payout.id} />
        </div>
        <Panel className="min-w-0">
          <PanelHeader>
            <PanelTitle>Money</PanelTitle>
          </PanelHeader>
          <div className="p-4">
            <KeyValues
              columns={1}
              items={[
                { label: "To the recipient", value: <Money value={payout.amount} /> },
                {
                  label: "Kept for transfer charges",
                  value: <Money value={payout.withdrawalFee} />,
                  hidden: !payout.walletBacked,
                },
                {
                  label: "Taken from the wallet",
                  value: <Money value={payout.amount + payout.withdrawalFee} />,
                  hidden: !payout.walletBacked,
                },
                { label: "Provider fee", value: <Money value={payout.fee ?? 0} />, hidden: payout.fee === null },
                { label: "Provider reference", value: payout.providerPayoutId, mono: true, hidden: !payout.providerPayoutId },
                { label: "Sent", value: formatDateTime(payout.dispatchedAt), mono: true, hidden: !payout.dispatchedAt },
                { label: "Paid", value: formatDateTime(payout.completedAt), mono: true, hidden: !payout.completedAt },
                { label: "Why it failed", value: payout.failureReason, hidden: !payout.failureReason },
              ]}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function HistoryPanel({ history }: { history: PayoutHistoryEntry[] }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Timeline</PanelTitle>
      </PanelHeader>
      {history.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nothing recorded yet.</p>
      ) : (
        <ol className="divide-y divide-border">
          {history.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-4 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-foreground">{HISTORY_LABELS[entry.action] ?? entry.action}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.actorType === "SYSTEM" ? "Automatic" : entry.actorType === "ADMIN" ? "By an admin" : "By the organizer"}
                  {typeof entry.metadata?.reason === "string" && <> · {entry.metadata.reason}</>}
                </p>
              </div>
              <span className="num shrink-0 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function PayoutActions({ payout }: { payout: AdminPayoutDetail }) {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const inFlight = payout.status === "PENDING" || payout.status === "PROCESSING";
  const waiting = payout.pendingRequests.some((r) => r.type === "PAYOUT_FORCE_FAIL");
  const eligible = canForceFail(payout) && !waiting;

  const items: ActionsMenuItem[] = inFlight
    ? [
        {
          key: "force-fail",
          label: payout.walletBacked ? "Fail it and refund the wallet" : "Fail it",
          tier: 3,
          destructive: true,
          disabled: !eligible,
          note: waiting
            ? "Already waiting for approval."
            : !eligible
              ? "Only once it has been in flight for over an hour."
              : undefined,
        },
      ]
    : [];

  return (
    <>
      <InlineConfirm
        key="recheck"
        available={inFlight}
        label="Re-check with provider"
        message={`Ask ${PROVIDER_LABELS[payout.provider]} where this payout is? Its status updates if they've settled it.`}
        confirmLabel="Re-check"
        invalidate={[payoutsKey, auditKey]}
        onConfirm={() => recheckPayout(payout.id)}
        successMessage={(result) =>
          result.status === result.previousStatus
            ? `No change: still ${result.status.toLowerCase()}`
            : `Now ${result.status.toLowerCase()}`
        }
      />
      <ActionsMenu items={items} onSelect={() => setOpen(true)} />
      <ActionSheet
        key="force-fail"
        tier={3}
        open={open}
        onOpenChange={setOpen}
        available={eligible}
        title={payout.walletBacked ? "Fail this payout and refund the wallet" : "Fail this settlement"}
        description={
          payout.walletBacked
            ? "When it's approved, the provider is asked once more. If they paid it, it's marked paid instead. If they say it failed or have no record of it, it fails and the money goes back to the organizer's wallet."
            : "When it's approved, the provider is asked once more. If they say it failed or have no record of it, it fails. No wallet is refunded: the seller still has to be paid another way."
        }
        destructive
        selfApprove={Boolean(me?.canApprove)}
        successMessage="Request sent"
        invalidate={[payoutsKey, auditKey]}
        summary={
          <KeyValues
            columns={1}
            items={[
              { label: "Reference", value: payout.reference, mono: true },
              { label: "Amount", value: <Money value={payout.amount} /> },
              { label: "Recipient", value: payout.user.name },
              { label: "In flight since", value: formatDateTime(payout.createdAt), mono: true },
            ]}
          />
        }
        onSubmit={(reason, extra) =>
          createAndMaybeSelfApprove({ type: "PAYOUT_FORCE_FAIL", targetId: payout.id, payload: {}, reason }, extra)
        }
      />
    </>
  );
}
