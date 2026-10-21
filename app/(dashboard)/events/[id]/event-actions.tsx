"use client";

import { useId, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { ActionSheet } from "@/components/actions/action-sheet";
import { ActionsMenu, type ActionsMenuItem } from "@/components/actions/actions-menu";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { EventEditSheet } from "@/components/event-edit-sheet";
import { KeyValues } from "@/components/key-values";
import { Money } from "@/components/money";
import { RefundModeOptions } from "@/components/refund-mode-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { formatCount } from "@/lib/format";
import { auditKey } from "@/services/v2/audit";
import {
  bpsToPercent,
  cancelEvent,
  eventsKey,
  FEE_MODE_LABELS,
  toggleEvent,
  updateEventFees,
  type AdminEventDetail,
  type FeeMode,
} from "@/services/v2/events";
import { useMe } from "@/services/v2/me";
import { refundsKey, type RefundMode } from "@/services/v2/refunds";
import { createAndMaybeSelfApprove } from "@/services/v2/requests";

type SheetKey = "edit" | "fees" | "cancel" | "refund-all";

const MAX_FEE_PERCENT = 30;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL;

/** Percent text ("3.5") to basis points, or null when it isn't 0-30 with ≤2 decimals. */
function percentToBps(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const bps = Math.round(Number(trimmed) * 100);
  return bps >= 0 && bps <= MAX_FEE_PERCENT * 100 ? bps : null;
}

const bpsText = (bps: number) => String(Number((bps / 100).toFixed(2)));

/**
 * What can be done to an event:
 *   not cancelled  Switch on/off (tier 1), Edit details (tier 1), Change fees (tier 2), Cancel (tier 2)
 *   any paid sales Refund all buyers (tier 3), suggested once cancelled
 * Cancelling is final: it switches the event off for good.
 */
export function EventActions({ event }: { event: AdminEventDetail }) {
  const { data: me } = useMe();
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const [fees, setFees] = useState({ primary: "", resale: "", royalty: "", mode: event.feeMode });
  const [refundMode, setRefundMode] = useState<RefundMode | null>(null);
  const [platformCovers, setPlatformCovers] = useState(false);
  const ids = { primary: useId(), resale: useId(), royalty: useId() };

  const cancelled = Boolean(event.cancelledAt);
  const refundAllWaiting = event.pendingRequests.some((r) => r.type === "EVENT_REFUND_ALL");
  const refundAllOpen =
    event.latestRefundAll && ["PENDING", "APPROVED", "FAILED"].includes(event.latestRefundAll.status);
  // The backend counts the exact purchases; it refuses when none are paid.
  const paidSales = event.stats.processed > 0;

  const can = {
    toggle: !cancelled,
    edit: !cancelled,
    fees: !cancelled,
    cancel: !cancelled,
    refundAll: paidSales && !refundAllWaiting && !refundAllOpen,
  };
  const invalidate = [eventsKey, auditKey];

  const parsed = {
    primary: percentToBps(fees.primary),
    resale: percentToBps(fees.resale),
    royalty: percentToBps(fees.royalty),
  };
  const feesValid = parsed.primary !== null && parsed.resale !== null && parsed.royalty !== null;
  const feesChanged =
    feesValid &&
    (parsed.primary !== event.primaryFeeBps ||
      parsed.resale !== event.resaleFeeBps ||
      parsed.royalty !== event.royaltyFeeBps ||
      fees.mode !== event.feeMode);

  const items: ActionsMenuItem[] = [];
  if (can.fees) items.push({ key: "fees", label: "Change fees", tier: 2 });
  if (can.cancel) items.push({ key: "cancel", label: "Cancel event", tier: 2, destructive: true });
  if (can.refundAll) {
    items.push({ key: "refund-all", label: "Refund all buyers", tier: 3, destructive: true });
  } else if (paidSales) {
    items.push({
      key: "refund-all",
      label: "Refund all buyers",
      tier: 3,
      disabled: true,
      note: "A refund of all buyers is already waiting or running for this event.",
    });
  }

  function open(key: string) {
    if (key === "fees") {
      setFees({
        primary: bpsText(event.primaryFeeBps),
        resale: bpsText(event.resaleFeeBps),
        royalty: bpsText(event.royaltyFeeBps),
        mode: event.feeMode,
      });
    }
    if (key === "refund-all") {
      setRefundMode(null);
      setPlatformCovers(false);
    }
    setSheet(key as SheetKey);
  }
  const sheetProps = (key: SheetKey) => ({
    open: sheet === key,
    onOpenChange: (next: boolean) => setSheet(next ? key : null),
  });

  return (
    <>
      {FRONTEND_URL && (
        <Button variant="ghost" asChild>
          <a href={`${FRONTEND_URL}/events/${event.slug}`} target="_blank" rel="noreferrer">
            Public page
            <HugeiconsIcon icon={LinkSquare02Icon} aria-hidden="true" className="text-muted-foreground" />
          </a>
        </Button>
      )}

      <InlineConfirm
        key="toggle"
        available={can.toggle}
        label={event.isActive ? "Switch off" : "Switch on"}
        message={
          event.isActive
            ? "Take this event off sale? Buyers can't buy tickets until it's switched back on. Existing tickets still work."
            : "Put this event back on sale?"
        }
        confirmLabel={event.isActive ? "Switch off" : "Switch on"}
        invalidate={invalidate}
        onConfirm={() => toggleEvent(event.id)}
        successMessage={(result) => (result.isActive ? "Event is on sale" : "Event is off sale")}
      />

      <Button key="edit" variant="secondary" onClick={() => setSheet("edit")} disabled={!can.edit}>
        Edit details
      </Button>

      <ActionsMenu items={items} onSelect={open} />

      <EventEditSheet key="edit-sheet" event={event} {...sheetProps("edit")} available={can.edit} />

      <ActionSheet
        key="fees"
        {...sheetProps("fees")}
        tier={2}
        available={can.fees}
        title="Change fees"
        description="Applies to sales from now on. Past sales keep the fees they were charged."
        confirmLabel="Save fees"
        successMessage="Fees updated"
        invalidate={invalidate}
        canSubmit={feesChanged}
        summary={
          <KeyValues
            columns={1}
            items={[
              { label: "Ticket fee now", value: bpsToPercent(event.primaryFeeBps), mono: true },
              { label: "Who pays now", value: FEE_MODE_LABELS[event.feeMode] },
              { label: "Resale fee now", value: bpsToPercent(event.resaleFeeBps), mono: true },
              { label: "Royalty now", value: bpsToPercent(event.royaltyFeeBps), mono: true },
            ]}
          />
        }
        onSubmit={(reason) =>
          updateEventFees(event.id, {
            primaryFeeBps: parsed.primary!,
            resaleFeeBps: parsed.resale!,
            royaltyFeeBps: parsed.royalty!,
            feeMode: fees.mode,
            reason,
          })
        }
      >
        <div className="space-y-4">
          {(
            [
              ["primary", "Ticket fee (%)"],
              ["resale", "Resale fee (%)"],
              ["royalty", "Organizer royalty on resales (%)"],
            ] as const
          ).map(([key, label]) => {
            const invalid = fees[key] !== "" && parsed[key] === null;
            return (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={ids[key]}>{label}</Label>
                <Input
                  id={ids[key]}
                  inputMode="decimal"
                  autoComplete="off"
                  className="num"
                  value={fees[key]}
                  aria-invalid={invalid || undefined}
                  aria-describedby={`${ids[key]}-hint`}
                  onChange={(e) => setFees((f) => ({ ...f, [key]: e.target.value }))}
                />
                <p id={`${ids[key]}-hint`} className={invalid ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                  Between 0 and {MAX_FEE_PERCENT}, up to two decimals.
                </p>
              </div>
            );
          })}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">Who pays the ticket fee</span>
            <Segmented<FeeMode>
              aria-label="Who pays the ticket fee"
              block
              value={fees.mode}
              onValueChange={(mode) => setFees((f) => ({ ...f, mode }))}
              options={[
                { value: "ATTENDEE", label: "Buyer" },
                { value: "ORGANIZER", label: "Organizer" },
              ]}
            />
          </div>
        </div>
      </ActionSheet>

      <ActionSheet
        key="cancel"
        {...sheetProps("cancel")}
        tier={2}
        available={can.cancel}
        title="Cancel this event"
        description="The event comes off sale for good, resale listings are taken down, and it can't be switched back on. Buyers are not refunded automatically: request that next."
        confirmLabel="Cancel event"
        destructive
        successMessage="Event cancelled"
        invalidate={invalidate}
        summary={
          <KeyValues
            columns={1}
            items={[
              { label: "Event", value: event.name },
              {
                label: "Tickets sold",
                value: `${formatCount(event.stats.ticketsSold)} of ${formatCount(event.stats.capacity)}`,
                mono: true,
              },
              { label: "Processed", value: <Money value={event.stats.processed} /> },
            ]}
          />
        }
        onSubmit={async (reason) => {
          const result = await cancelEvent(event.id, reason);
          // Offer the natural next step straight away.
          if (paidSales) setTimeout(() => open("refund-all"), 300);
          return result;
        }}
      />

      <ActionSheet
        key="refund-all"
        {...sheetProps("refund-all")}
        tier={3}
        available={can.refundAll}
        title="Refund all buyers"
        description="Every paid purchase for this event is refunded in full, one at a time. Each buyer's tickets are voided and the organizer's and platform's shares reversed."
        destructive
        selfApprove={Boolean(me?.canApprove)}
        successMessage="Refund of all buyers requested"
        invalidate={[...invalidate, refundsKey]}
        canSubmit={refundMode !== null}
        summary={
          <div className="space-y-2">
            <KeyValues
              columns={1}
              items={[
                { label: "Event", value: event.name },
                { label: "Processed so far", value: <Money value={event.stats.processed} /> },
              ]}
            />
            {!cancelled && (
              <p className="text-muted-foreground">
                This event isn&apos;t cancelled. Cancel it first if it isn&apos;t going ahead, so no one buys after the refunds.
              </p>
            )}
            <p className="text-muted-foreground">The exact count and total are shown on the request once it&apos;s created.</p>
          </div>
        }
        onSubmit={(reason, extra) =>
          createAndMaybeSelfApprove(
            {
              type: "EVENT_REFUND_ALL",
              targetId: event.id,
              payload: { mode: refundMode, platformCoversOrganizerShare: platformCovers },
              reason,
            },
            extra,
          )
        }
      >
        <RefundModeOptions
          mode={refundMode}
          onModeChange={setRefundMode}
          platformCovers={platformCovers}
          onPlatformCoversChange={setPlatformCovers}
        />
      </ActionSheet>
    </>
  );
}
