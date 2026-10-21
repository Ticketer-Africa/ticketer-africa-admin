"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ActionSheet } from "@/components/actions/action-sheet";
import { DetailHeader } from "@/components/detail-header";
import { EntityLink, entityHref } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { LedgerEntries } from "@/components/ledger-entries";
import { Money } from "@/components/money";
import { RecordActivity } from "@/components/record-activity";
import { RequestBanner } from "@/components/request-banner";
import { SoldBar } from "@/components/sold-bar";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatDate, formatDateTime } from "@/lib/format";
import { auditKey } from "@/services/v2/audit";
import { eventStatus } from "@/services/v2/events";
import {
  organizersKey,
  unverifyOrganizer,
  useOrganizer,
  verifyOrganizer,
  type AdminOrganizerDetail,
} from "@/services/v2/organizers";

export default function OrganizerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useOrganizer(id);

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load this organizer"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  const org = query.data;
  return (
    <div>
      <DetailHeader
        backHref="/organizers"
        backLabel="Organizers"
        title={org.name}
        status={
          <>
            {org.organizerVerifiedAt ? (
              <Badge variant="success" dot>
                Verified
              </Badge>
            ) : (
              <Badge variant="neutral">Not verified</Badge>
            )}
            {org.suspendedAt && (
              <Badge variant="destructive" dot>
                Suspended
              </Badge>
            )}
          </>
        }
        subtitle={<span className="num">{org.email}</span>}
        facts={[
          {
            label: "Wallet",
            value: org.wallet ? (
              <Link href={entityHref("wallet", org.id)} className="underline-offset-4 hover:underline">
                <Money value={org.wallet.balance} />
              </Link>
            ) : (
              <span className="text-muted-foreground">No wallet</span>
            ),
          },
          { label: "Processed", value: <Money value={org.totals.processed} /> },
          { label: "Ticketer Africa kept", value: <Money value={org.totals.platformProfit} /> },
          { label: "Joined", value: <span className="num">{formatDate(org.createdAt)}</span> },
        ]}
        actions={<OrganizerActions org={org} />}
      />

      <RequestBanner targetType="user" targetId={org.id} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          <EventsPanel org={org} />
          <Panel>
            <PanelHeader>
              <PanelTitle>Recent wallet entries</PanelTitle>
              {org.wallet && (
                <Link
                  href={entityHref("wallet", org.id)}
                  className="text-sm font-medium text-primary-text underline-offset-4 hover:underline"
                >
                  Full ledger
                </Link>
              )}
            </PanelHeader>
            <div className="p-4">
              <LedgerEntries
                entries={org.ledger.map((entry) => ({
                  ...entry,
                  owner: { id: org.id, name: org.name, email: org.email },
                }))}
                emptyText="No wallet activity yet."
              />
            </div>
          </Panel>
          <RecordActivity targetType="user" targetId={org.id} />
        </div>
        <div className="min-w-0 space-y-5">
          <DestinationsPanel org={org} />
          <PayoutsPanel org={org} />
        </div>
      </div>
    </div>
  );
}

function OrganizerActions({ org }: { org: AdminOrganizerDetail }) {
  const [open, setOpen] = useState<"verify" | "unverify" | null>(null);
  const verified = Boolean(org.organizerVerifiedAt);
  const summary = (
    <KeyValues
      columns={1}
      items={[
        { label: "Organizer", value: org.name },
        { label: "Email", value: <span className="break-all">{org.email}</span>, mono: true },
        { label: "Events", value: formatCount(org.events.length), mono: true },
      ]}
    />
  );
  const sheetProps = (key: "verify" | "unverify") => ({
    open: open === key,
    onOpenChange: (next: boolean) => setOpen(next ? key : null),
  });
  return (
    <>
      <Button variant="ghost" asChild>
        <Link href={entityHref("user", org.id)}>User account</Link>
      </Button>
      <Button key="verify-button" variant="secondary" onClick={() => setOpen(verified ? "unverify" : "verify")}>
        {verified ? "Remove verification" : "Verify"}
      </Button>
      {/* Two stable sheets: after a refetch flips `verified`, an open sheet
          keeps its own action instead of becoming the other one. */}
      <ActionSheet
        key="verify"
        {...sheetProps("verify")}
        tier={2}
        available={!verified}
        title="Verify this organizer"
        description="Marks them as checked by Ticketer Africa. It's a label for now; it doesn't change what they can do."
        confirmLabel="Verify"
        successMessage="Organizer verified"
        invalidate={[organizersKey, auditKey]}
        summary={summary}
        onSubmit={(reason) => verifyOrganizer(org.id, reason)}
      />
      <ActionSheet
        key="unverify"
        {...sheetProps("unverify")}
        tier={2}
        available={verified}
        title="Remove verification"
        description="They lose the verified mark. Nothing else about their account changes."
        confirmLabel="Remove verification"
        destructive
        successMessage="Verification removed"
        invalidate={[organizersKey, auditKey]}
        summary={summary}
        onSubmit={(reason) => unverifyOrganizer(org.id, reason)}
      />
    </>
  );
}

function EventsPanel({ org }: { org: AdminOrganizerDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Events</PanelTitle>
        <Link
          href={`/events?organizerId=${org.id}`}
          className="text-sm font-medium text-primary-text underline-offset-4 hover:underline"
        >
          All their events
        </Link>
      </PanelHeader>
      {org.events.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {org.events.slice(0, 12).map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <div className="min-w-0">
                <EntityLink kind="event" id={event.id} label={event.name} className="text-sm" />
                <p className="num text-xs text-muted-foreground">{formatDate(event.date)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge kind="event" value={eventStatus(event)} />
                <SoldBar sold={event.ticketsSold} capacity={event.capacity} className="hidden w-28 xl:block" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function DestinationsPanel({ org }: { org: AdminOrganizerDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Bank details</PanelTitle>
      </PanelHeader>
      {org.payoutDestinations.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No bank details added.</p>
      ) : (
        <ul className="divide-y divide-border">
          {org.payoutDestinations.map((dest) => (
            <li key={dest.id} className="space-y-1 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-foreground">
                  {dest.bankName ?? dest.label} <span className="num text-muted-foreground">•••• {dest.last4}</span>
                </span>
                <StatusBadge kind="destination" value={dest.status} />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {dest.resolvedAccountName ?? "Name not resolved"}
                {dest.isDefault && " · default"}
              </p>
              {dest.statusReason && <p className="text-xs text-muted-foreground">{dest.statusReason}</p>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function PayoutsPanel({ org }: { org: AdminOrganizerDetail }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Recent payouts</PanelTitle>
        <Link
          href={`/payouts?userId=${org.id}`}
          className="text-sm font-medium text-primary-text underline-offset-4 hover:underline"
        >
          All payouts
        </Link>
      </PanelHeader>
      {org.recentPayouts.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No payouts yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {org.recentPayouts.map((payout) => (
            <li key={payout.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <EntityLink kind="payout" id={payout.id} label={<Money value={payout.amount} />} className="text-sm" />
                <p className="num text-xs text-muted-foreground">{formatDateTime(payout.createdAt)}</p>
              </div>
              <StatusBadge kind="payout" value={payout.status} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
