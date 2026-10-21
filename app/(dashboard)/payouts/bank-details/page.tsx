"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { ActionSheet } from "@/components/actions/action-sheet";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { EmptyState } from "@/components/empty-state";
import { EntityLink } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { auditKey } from "@/services/v2/audit";
import type { DestinationStatus } from "@/services/v2/organizers";
import {
  approveRouting,
  payoutsKey,
  refreshDestination,
  rejectDestination,
  useDestinations,
  type AdminDestination,
} from "@/services/v2/payouts";

type Tab = "PENDING_REVIEW" | "REJECTED" | "APPROVED";

interface PendingRouting {
  bankCode: string;
  last4: string;
}

const asRouting = (value: unknown): PendingRouting | null =>
  value && typeof value === "object" && "last4" in value ? (value as PendingRouting) : null;

export default function BankDetailsPage() {
  const [tab, setTab] = useState<Tab>("PENDING_REVIEW");
  const query = useDestinations(tab === "PENDING_REVIEW" ? undefined : tab);

  return (
    <div>
      <PageHeader
        title="Bank details"
        description="Accounts organizers want to be paid into. New ones, and changes to existing ones, wait here until someone checks them."
      />
      <Segmented<Tab>
        aria-label="Which bank details"
        className="mb-4"
        value={tab}
        onValueChange={setTab}
        options={[
          { value: "PENDING_REVIEW", label: "To review" },
          { value: "REJECTED", label: "Rejected" },
          { value: "APPROVED", label: "Approved" },
        ]}
      />
      {query.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      ) : query.isError ? (
        <ErrorState
          title="Couldn't load bank details"
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isRefetching}
        />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          title={tab === "PENDING_REVIEW" ? "Nothing to review" : "None here"}
          hint={
            tab === "PENDING_REVIEW"
              ? "New bank accounts and account changes show up here."
              : "Bank details you've decided on show up here."
          }
        />
      ) : (
        <ul className="space-y-3">
          {query.data.items.map((dest) => (
            <li key={dest.id}>
              <DestinationCard dest={dest} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DestinationCard({ dest }: { dest: AdminDestination }) {
  const [sheet, setSheet] = useState<"approve" | "reject" | null>(null);
  const routing = asRouting(dest.pendingRouting);
  const mismatch = /match/i.test(dest.statusReason ?? "");
  const decided = dest.status === "REJECTED" || dest.status === "DEACTIVATED";
  const invalidate = [payoutsKey, auditKey];
  const owner = dest.user;

  const summary = (
    <KeyValues
      columns={1}
      items={[
        { label: "Owner", value: owner ? `${owner.name} (${owner.email})` : dest.userId },
        { label: "Bank", value: `${dest.bankName ?? dest.label} •••• ${dest.last4}`, mono: true },
        { label: "Name on the account", value: dest.resolvedAccountName ?? "Not resolved" },
        {
          label: "Change asked for",
          value: routing ? `Bank ${routing.bankCode}, account ending ${routing.last4}` : null,
          mono: true,
          hidden: !routing,
        },
      ]}
    />
  );

  return (
    <Panel className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {dest.bankName ?? dest.label} <span className="num text-muted-foreground">•••• {dest.last4}</span>
          </span>
          <StatusBadge kind="destination" value={dest.status as DestinationStatus} />
          {routing && <span className="text-xs text-warning">Account change waiting</span>}
        </div>
        <p className="text-sm text-foreground">
          {owner ? <EntityLink kind="organizer" id={dest.userId} label={owner.name} /> : <span className="num">{dest.userId}</span>}
          {owner && <span className="num text-xs text-muted-foreground"> · {owner.email}</span>}
        </p>
        <p className={mismatch ? "flex items-start gap-1.5 text-sm text-foreground" : "text-sm text-muted-foreground"}>
          {mismatch && <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />}
          <span>
            Name on the account: <strong className="font-medium">{dest.resolvedAccountName ?? "not resolved"}</strong>
            {dest.statusReason && <span className="text-muted-foreground"> · {dest.statusReason}</span>}
          </span>
        </p>
        {routing && (
          <p className="num text-xs text-muted-foreground">
            Wants to switch to bank {routing.bankCode}, account ending {routing.last4}
          </p>
        )}
        <p className="num text-xs text-muted-foreground">Added {formatDateTime(dest.createdAt)}</p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <InlineConfirm
          key="refresh"
          available={!decided}
          label="Refresh"
          message="Ask the provider whether it has finished checking this account?"
          confirmLabel="Refresh"
          invalidate={invalidate}
          onConfirm={() => refreshDestination(dest.id)}
          successMessage={(view) => `Status: ${view.status.replace("_", " ").toLowerCase()}`}
        />
        {routing && (
          <Button key="approve" variant="secondary" onClick={() => setSheet("approve")}>
            Approve change
          </Button>
        )}
        {!decided && (
          <Button key="reject" variant="destructive-outline" onClick={() => setSheet("reject")}>
            Reject
          </Button>
        )}
        <ActionSheet
          key="approve-sheet"
          tier={2}
          open={sheet === "approve"}
          onOpenChange={(next) => setSheet(next ? "approve" : null)}
          available={Boolean(routing)}
          title="Approve this account change"
          description="Payouts go to the new account from now on. Check the change really came from the organizer first."
          confirmLabel="Approve change"
          successMessage="Account change approved"
          invalidate={invalidate}
          summary={summary}
          onSubmit={(reason) => approveRouting(dest.id, reason)}
        />
        <ActionSheet
          key="reject-sheet"
          tier={2}
          open={sheet === "reject"}
          onOpenChange={(next) => setSheet(next ? "reject" : null)}
          available={!decided}
          title="Reject these bank details"
          description="Nothing can be paid into this account. The organizer has to add different details."
          confirmLabel="Reject"
          destructive
          successMessage="Bank details rejected"
          invalidate={invalidate}
          summary={summary}
          onSubmit={(reason) => rejectDestination(dest.id, reason)}
        />
      </div>
    </Panel>
  );
}
