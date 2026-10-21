"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { ActionSheet } from "@/components/actions/action-sheet";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { DetailHeader } from "@/components/detail-header";
import { ErrorState } from "@/components/error-state";
import { KeyValues, type KeyValueItem } from "@/components/key-values";
import { Money } from "@/components/money";
import { ActivityFeed } from "@/components/activity-feed";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCount, formatDateTime } from "@/lib/format";
import { auditKey, useRequestActivity } from "@/services/v2/audit";
import { useMe } from "@/services/v2/me";
import { REQUEST_TYPE_LABELS, requestTargetHref } from "@/services/v2/request-labels";
import {
  approveRequest,
  cancelRequest,
  pendingCountKey,
  rejectRequest,
  requestsKey,
  retryRequest,
  useRequest,
} from "@/services/v2/requests";
import type { AdminRequest } from "@/services/v2/types";

const STALE_APPROVED_MS = 10 * 60 * 1000;

/** Kobo string (as stored on requests) to naira. */
const koboToNaira = (value: unknown) =>
  typeof value === "string" && /^-?\d+$/.test(value) ? Number(BigInt(value)) / 100 : null;

/** The stored payload and result in plain words; amounts in naira. */
function detailsOf(request: AdminRequest): KeyValueItem[] {
  const p = request.payload as Record<string, unknown>;
  const r = (request.result ?? {}) as Record<string, unknown>;
  switch (request.type) {
    case "REFUND":
    case "EVENT_REFUND_ALL":
      return [
        {
          label: "How the money goes back",
          value: p.mode === "KORAPAY" ? "Korapay, to the buyer's card or account" : "Manual, sent another way",
        },
        {
          label: "If the organizer's wallet is short",
          value: p.platformCoversOrganizerShare ? "The platform covers their share" : "The refund stops",
        },
        ...(request.type === "EVENT_REFUND_ALL" && Array.isArray(r.transactionIds)
          ? [
              { label: "Refunds to run", value: formatCount(Number(r.queued ?? 0)), mono: true },
              { label: "Completed", value: formatCount(Number(r.completed ?? 0)), mono: true },
              { label: "Failed", value: formatCount(Array.isArray(r.failed) ? r.failed.length : 0), mono: true },
            ]
          : []),
      ];
    case "WALLET_ADJUSTMENT": {
      const amount = koboToNaira(p.amountKobo);
      return [
        { label: "Direction", value: p.direction === "DEBIT" ? "Debit (take money)" : "Credit (add money)" },
        { label: "Amount", value: amount === null ? "—" : <Money value={amount} /> },
        { label: "Memo", value: String(p.memo ?? "") },
        {
          label: "Balance after",
          value: koboToNaira(r.balanceAfter) === null ? null : <Money value={koboToNaira(r.balanceAfter)!} />,
          hidden: koboToNaira(r.balanceAfter) === null,
        },
      ];
    }
    case "PRIVILEGED_ROLE_CHANGE":
      return [{ label: "New role", value: String(p.role ?? "").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) }];
    case "PAYOUT_FORCE_FAIL":
      return r.outcome
        ? [{ label: "What happened", value: r.outcome === "settled" ? "The provider had paid it, so it was marked paid" : r.outcome === "failed" ? "Failed" : String(r.outcome) }]
        : [];
    default:
      return [];
  }
}

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useRequest(id);

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load this request"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  const request = query.data;
  const targetHref = requestTargetHref(request.targetType, request.targetId);
  const details = detailsOf(request);

  return (
    <div>
      <DetailHeader
        backHref="/approvals"
        backLabel="Approvals"
        title={<span className="text-lg md:text-xl">{request.summary}</span>}
        status={<StatusBadge kind="request" value={request.status} />}
        subtitle={
          <>
            {REQUEST_TYPE_LABELS[request.type]} · <span className="num">{formatDateTime(request.createdAt)}</span>
          </>
        }
        facts={[
          { label: "Asked by", value: request.requestedBy.name },
          ...(request.decidedBy
            ? [{ label: request.selfApproved ? "Approved by themselves" : "Decided by", value: request.decidedBy.name }]
            : []),
          ...(targetHref
            ? [
                {
                  label: "About",
                  value: (
                    <Link href={targetHref} className="underline underline-offset-4">
                      Open the record
                    </Link>
                  ),
                },
              ]
            : []),
        ]}
        actions={<Decisions request={request} />}
      />

      {request.status === "FAILED" && request.failureReason && (
        <Panel className="mb-5 flex items-start gap-2 border-destructive/40 p-4 text-sm text-foreground" role="alert">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span>
            It was approved but didn&apos;t run: {request.failureReason}
          </span>
        </Panel>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Panel>
            <PanelHeader>
              <PanelTitle>Why</PanelTitle>
            </PanelHeader>
            <div className="space-y-3 p-4 text-sm">
              <p className="text-foreground">“{request.requestReason}”</p>
              <p className="text-xs text-muted-foreground">{request.requestedBy.name} · {request.requestedBy.email}</p>
              {request.decisionReason && (
                <div className="border-t border-border pt-3">
                  <p className="text-foreground">“{request.decisionReason}”</p>
                  <p className="text-xs text-muted-foreground">{request.decidedBy?.name}</p>
                </div>
              )}
            </div>
          </Panel>
          <RequestActivity requestId={request.id} />
        </div>
        <Panel className="min-w-0">
          <PanelHeader>
            <PanelTitle>Details</PanelTitle>
          </PanelHeader>
          <div className="space-y-3 p-4">
            {details.length === 0 && !request.decidedAt && (
              <p className="text-sm text-muted-foreground">Nothing else to set: the summary says it all.</p>
            )}
            <KeyValues
              columns={1}
              items={[
                ...details,
                { label: "Decided", value: formatDateTime(request.decidedAt), mono: true, hidden: !request.decidedAt },
                { label: "Ran", value: formatDateTime(request.executedAt), mono: true, hidden: !request.executedAt },
              ]}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Decisions({ request }: { request: AdminRequest }) {
  const { data: me } = useMe();
  const [sheet, setSheet] = useState<"approve" | "reject" | "self" | null>(null);
  const [note, setNote] = useState("");
  const noteId = useId();
  // Read the clock once; "stalled" only needs minute precision.
  const [now] = useState(() => Date.now());
  if (!me) return null;

  const pending = request.status === "PENDING";
  const mine = request.requestedById === me.id;
  const stalled =
    request.status === "APPROVED" &&
    request.decidedAt !== null &&
    now - new Date(request.decidedAt).getTime() > STALE_APPROVED_MS;
  const invalidate = [requestsKey, pendingCountKey, auditKey];
  const can = {
    decide: pending && me.canApprove && !mine,
    self: pending && me.canApprove && mine,
    cancel: pending && mine,
    retry: me.canApprove && (request.status === "FAILED" || stalled),
  };
  const sheetProps = (key: "approve" | "reject" | "self") => ({
    open: sheet === key,
    onOpenChange: (next: boolean) => {
      if (next) setNote("");
      setSheet(next ? key : null);
    },
  });

  return (
    <>
      <InlineConfirm
        key="cancel"
        available={can.cancel}
        label="Withdraw"
        message="Withdraw this request? Nothing runs, and it can't be approved afterwards."
        confirmLabel="Withdraw"
        invalidate={invalidate}
        onConfirm={() => cancelRequest(request.id)}
        successMessage="Request withdrawn"
      />
      <InlineConfirm
        key="retry"
        available={can.retry}
        label="Retry"
        message="Run it again? Steps that already happened aren't repeated."
        confirmLabel="Retry"
        invalidate={invalidate}
        onConfirm={() => retryRequest(request.id)}
        successMessage={(result) => (result.status === "EXECUTED" ? "It ran" : `Still ${result.status.toLowerCase()}`)}
      />
      {can.decide && (
        <>
          <Button key="reject-button" variant="destructive-outline" onClick={() => sheetProps("reject").onOpenChange(true)}>
            Reject
          </Button>
          <Button key="approve-button" variant="primary" onClick={() => sheetProps("approve").onOpenChange(true)}>
            Approve
          </Button>
        </>
      )}
      {can.self && (
        <Button key="self-button" variant="secondary" onClick={() => sheetProps("self").onOpenChange(true)}>
          Approve it myself
        </Button>
      )}

      <ActionSheet
        key="approve"
        {...sheetProps("approve")}
        tier={1}
        available={can.decide}
        title="Approve and run"
        description="It runs as soon as you approve. You can't undo it from here."
        confirmLabel="Approve and run"
        successMessage="Approved"
        invalidate={invalidate}
        summary={<p className="text-foreground">{request.summary}</p>}
        onSubmit={() => approveRequest(request.id, note.trim() ? { reason: note.trim() } : {})}
      >
        <div className="space-y-1.5">
          <Label htmlFor={noteId}>Note (optional)</Label>
          <Textarea id={noteId} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </ActionSheet>

      <ActionSheet
        key="reject"
        {...sheetProps("reject")}
        tier={2}
        available={can.decide}
        title="Reject this request"
        description="Nothing runs. The person who asked sees your reason."
        confirmLabel="Reject"
        destructive
        successMessage="Rejected"
        invalidate={invalidate}
        summary={<p className="text-foreground">{request.summary}</p>}
        onSubmit={(reason) => rejectRequest(request.id, reason)}
      />

      <ActionSheet
        key="self"
        {...sheetProps("self")}
        tier={2}
        reasonMin={20}
        available={can.self}
        title="Approve your own request"
        description="Only when the other founder can't respond. It runs straight away, and every other superadmin is emailed with your reason."
        confirmLabel="Approve and run"
        destructive
        successMessage="Approved by you. The other founder has been emailed."
        invalidate={invalidate}
        reasonLabel="Why you can't wait"
        summary={<p className="text-foreground">{request.summary}</p>}
        onSubmit={(reason) => approveRequest(request.id, { reason, selfApprove: true })}
      />
    </>
  );
}

function RequestActivity({ requestId }: { requestId: string }) {
  const activity = useRequestActivity(requestId);
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Activity</PanelTitle>
      </PanelHeader>
      <div className="p-4">
        {activity.isPending ? (
          <Skeleton className="h-10 w-full" />
        ) : activity.isError ? (
          <ErrorState title="Couldn't load activity" error={activity.error} onRetry={() => void activity.refetch()} />
        ) : (
          <ActivityFeed entries={activity.data.items} showTarget emptyText="Nothing recorded yet." />
        )}
      </div>
    </Panel>
  );
}
