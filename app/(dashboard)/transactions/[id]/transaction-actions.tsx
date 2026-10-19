"use client";

import { useId, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { ActionSheet } from "@/components/actions/action-sheet";
import { ActionsMenu, type ActionsMenuItem } from "@/components/actions/actions-menu";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { KeyValues } from "@/components/key-values";
import { Money } from "@/components/money";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCount, formatDateTime, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { auditKey } from "@/services/v2/audit";
import { useMe } from "@/services/v2/me";
import { refundsKey, type RefundMode } from "@/services/v2/refunds";
import { createAndMaybeSelfApprove } from "@/services/v2/requests";
import {
  markTransactionFailed,
  recheckTransaction,
  recoverTransaction,
  resendTickets,
  transactionsKey,
  type AdminTransactionDetail,
} from "@/services/v2/transactions";

type SheetKey = "mark-failed" | "recover" | "refund";

const HOUR_MS = 3_600_000;
/** Korapay won't refund less than this (naira). */
const KORAPAY_MIN_REFUND = 100;
const RECOVER_WARNING =
  "This payment is over an hour old. Discount, recipient and invite details held for 1 hour may have expired, so they may not be applied.";

/**
 * What can be done to a transaction now:
 *   PENDING          Re-check with Korapay (tier 1), Mark failed (tier 2)
 *   FAILED purchase  Re-check with Korapay & recover (tier 2)
 *   SUCCESS purchase Resend tickets (tier 1), Refund (tier 3)
 *   RESALE           refund and recover shown disabled, with why
 * Tier 1 actions are buttons with an inline confirm; tiers 2 and 3 sit in
 * the Actions menu and open sheets, all kept mounted with stable keys.
 */
export function TransactionActions({ txn }: { txn: AdminTransactionDetail }) {
  const { data: me } = useMe();
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const [includeRecipients, setIncludeRecipients] = useState(false);
  const [mode, setMode] = useState<RefundMode | null>(null);
  const [platformCovers, setPlatformCovers] = useState(false);
  // Worked out when the recover sheet opens (not during render).
  const [overAnHourOld, setOverAnHourOld] = useState(false);
  const recipientsId = useId();

  const invalidate = [transactionsKey, auditKey];
  const isPurchase = txn.type === "PURCHASE";
  const isResale = txn.type === "RESALE";
  const pending = txn.status === "PENDING";
  const failed = txn.status === "FAILED";
  const paid = txn.status === "SUCCESS";
  const refundWaiting = txn.pendingRequests.some((request) => request.type === "REFUND");
  const refundUnderway = Boolean(txn.refund && txn.refund.status !== "FAILED");

  const can = {
    recheck: pending,
    markFailed: pending,
    recover: failed && isPurchase,
    resend: paid && isPurchase,
    refund: paid && isPurchase && !refundWaiting && !refundUnderway,
  };

  const hasRecipients = txn.tickets.some(
    (ticket) => !ticket.voidedAt && ticket.recipientEmail && ticket.recipientEmail !== txn.user.email,
  );

  const items: ActionsMenuItem[] = [];
  if (can.markFailed) {
    items.push({ key: "mark-failed", label: "Mark failed", tier: 2, destructive: true });
  }
  if (failed && isResale) {
    items.push({
      key: "recover",
      label: "Re-check with Korapay & recover",
      tier: 2,
      disabled: true,
      note: "Resale payments can't be recovered here; refund the buyer manually.",
    });
  } else if (can.recover) {
    items.push({ key: "recover", label: "Re-check with Korapay & recover", tier: 2 });
  }
  if (paid && isResale) {
    items.push({
      key: "refund",
      label: "Refund",
      tier: 3,
      disabled: true,
      note: "Resale refunds aren't supported yet.",
    });
  } else if (paid && isPurchase && (refundWaiting || refundUnderway)) {
    items.push({
      key: "refund",
      label: "Refund",
      tier: 3,
      disabled: true,
      note: refundWaiting
        ? "A refund is already waiting for approval."
        : "A refund is already under way.",
    });
  } else if (can.refund) {
    items.push({ key: "refund", label: "Refund", tier: 3 });
  }

  function open(key: string) {
    if (key === "refund") {
      setMode(null);
      setPlatformCovers(false);
    }
    if (key === "recover") {
      setOverAnHourOld(Date.now() - new Date(txn.createdAt).getTime() > HOUR_MS);
    }
    setSheet(key as SheetKey);
  }
  const sheetProps = (key: SheetKey) => ({
    open: sheet === key,
    onOpenChange: (next: boolean) => setSheet(next ? key : null),
  });

  return (
    <>
      <InlineConfirm
        key="recheck"
        available={can.recheck}
        label="Re-check with Korapay"
        message="Ask Korapay whether this payment went through? If it did, the purchase completes and the buyer gets their tickets. Nothing is marked failed."
        confirmLabel="Re-check"
        invalidate={invalidate}
        onConfirm={() => recheckTransaction(txn.id)}
        successMessage={(result) =>
          result.outcome === "success"
            ? "Korapay confirmed it: the payment is complete"
            : "Not confirmed by Korapay: it stays pending"
        }
      />
      <InlineConfirm
        key="resend"
        available={can.resend}
        label="Resend tickets"
        message={
          <>
            Email the tickets to <span className="num break-all">{txn.user.email}</span> again?
          </>
        }
        confirmLabel="Resend"
        invalidate={[auditKey]}
        onConfirm={() => resendTickets(txn.id, hasRecipients && includeRecipients)}
        successMessage={(result) => {
          const tickets = `${formatCount(result.ticketCount)} ticket${result.ticketCount === 1 ? "" : "s"}`;
          const recipients = result.recipientEmailsSent
            ? ` and ${formatCount(result.recipientEmailsSent)} recipient email${result.recipientEmailsSent === 1 ? "" : "s"}`
            : "";
          return `Sent ${tickets} to ${result.sentTo}${recipients}`;
        }}
      >
        {hasRecipients && (
          <div className="flex items-start gap-2">
            <Checkbox
              id={recipientsId}
              checked={includeRecipients}
              onCheckedChange={(checked) => setIncludeRecipients(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor={recipientsId} className="font-normal leading-snug">
              Also resend the recipients&apos; emails
            </Label>
          </div>
        )}
      </InlineConfirm>

      <ActionsMenu items={items} onSelect={open} />

      <ActionSheet
        key="mark-failed"
        {...sheetProps("mark-failed")}
        tier={2}
        available={can.markFailed}
        title="Mark this payment failed"
        description="Only if Korapay confirms the charge failed (or has no record of it after an hour). The buyer gets no tickets."
        confirmLabel="Mark failed"
        destructive
        successMessage="Payment marked failed"
        invalidate={invalidate}
        summary={<TransactionSummary txn={txn} />}
        onSubmit={(reason) => markTransactionFailed(txn.id, reason)}
      />

      <ActionSheet
        key="recover"
        {...sheetProps("recover")}
        tier={2}
        available={can.recover}
        title="Re-check with Korapay & recover"
        description="If Korapay now says the charge succeeded, the purchase completes as normal: tickets are issued, the money is split and the buyer is emailed. Otherwise nothing changes."
        confirmLabel="Re-check and recover"
        successMessage="Payment recovered"
        invalidate={invalidate}
        summary={
          <div className="space-y-3">
            <TransactionSummary txn={txn} />
            {overAnHourOld && <Warning>{RECOVER_WARNING}</Warning>}
          </div>
        }
        onSubmit={async (reason) => {
          const result = await recoverTransaction(txn.id, reason);
          if (result.outcome !== "recovered") {
            throw new Error(
              "Korapay doesn't report this payment as successful, so nothing changed.",
            );
          }
          if (result.warning) {
            toast.warning("Recovered, but check the details", {
              description: result.warning,
              duration: 15_000,
            });
          }
          return result;
        }}
      />

      <ActionSheet
        key="refund"
        {...sheetProps("refund")}
        tier={3}
        available={can.refund}
        title="Refund this purchase"
        description="The whole payment goes back to the buyer, the organizer's and platform's shares are reversed, and the tickets are voided."
        destructive
        selfApprove={Boolean(me?.canApprove)}
        successMessage="Refund requested"
        invalidate={[...invalidate, refundsKey]}
        canSubmit={mode !== null && !(mode === "KORAPAY" && txn.amount < KORAPAY_MIN_REFUND)}
        summary={<RefundSummary txn={txn} platformCovers={platformCovers} />}
        onSubmit={(reason, extra) =>
          createAndMaybeSelfApprove(
            {
              type: "REFUND",
              targetId: txn.id,
              payload: { mode, platformCoversOrganizerShare: platformCovers },
              reason,
            },
            extra,
          )
        }
      >
        <RefundOptions
          amount={txn.amount}
          mode={mode}
          onModeChange={setMode}
          platformCovers={platformCovers}
          onPlatformCoversChange={setPlatformCovers}
        />
      </ActionSheet>
    </>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-foreground">
      <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
      <span>{children}</span>
    </p>
  );
}

function TransactionSummary({ txn }: { txn: AdminTransactionDetail }) {
  return (
    <KeyValues
      columns={1}
      items={[
        { label: "Reference", value: txn.reference, mono: true },
        { label: "Amount", value: <Money value={txn.amount} /> },
        { label: "Buyer", value: <span className="break-all">{txn.user.email}</span>, mono: true },
        { label: "Started", value: formatDateTime(txn.createdAt), mono: true },
      ]}
    />
  );
}

/**
 * What the refund moves, from the sale's own ledger credits: the organizer's
 * PURCHASE_PROCEEDS and the platform's PLATFORM_FEE. Older purchases have
 * none, and the backend recomputes the split.
 */
function RefundSummary({
  txn,
  platformCovers,
}: {
  txn: AdminTransactionDetail;
  platformCovers: boolean;
}) {
  const organizer = txn.ledger.find((entry) => entry.type === "PURCHASE_PROCEEDS");
  const platform = txn.ledger.find((entry) => entry.type === "PLATFORM_FEE");
  const hasLedger = Boolean(organizer || platform);
  const liveTickets = txn.tickets.filter((ticket) => !ticket.voidedAt).length;

  return (
    <div className="space-y-3">
      <dl className="space-y-2">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="min-w-0 text-muted-foreground">
            To the buyer
            <span className="num block break-all text-xs">{txn.user.email}</span>
          </dt>
          <dd className="shrink-0 font-semibold text-foreground">
            <Money value={txn.amount} />
          </dd>
        </div>
        {hasLedger ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="min-w-0 text-muted-foreground">
                Reversed from the organizer
                {organizer && <span className="block text-xs">{organizer.owner.name}</span>}
              </dt>
              <dd className="shrink-0 text-foreground">
                <Money value={organizer?.amount ?? 0} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="min-w-0 text-muted-foreground">Reversed from the platform</dt>
              <dd className="shrink-0 text-foreground">
                <Money value={platform?.amount ?? 0} />
              </dd>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            No ledger record — the backend will use the recomputed split.
          </p>
        )}
      </dl>
      <p className="text-muted-foreground">
        {liveTickets > 0
          ? `${formatCount(liveTickets)} ticket${liveTickets === 1 ? " is" : "s are"} voided and go${liveTickets === 1 ? "es" : ""} back on sale (unless the event is cancelled).`
          : "No valid tickets left to void."}
      </p>
      {platformCovers && (
        <p className="text-muted-foreground">
          If the organizer&apos;s wallet is short
          {organizer ? <> of <span className="num">{formatNaira(organizer.amount)}</span></> : null}, the
          platform wallet pays their share instead.
        </p>
      )}
    </div>
  );
}

function RefundOptions({
  amount,
  mode,
  onModeChange,
  platformCovers,
  onPlatformCoversChange,
}: {
  amount: number;
  mode: RefundMode | null;
  onModeChange: (mode: RefundMode) => void;
  platformCovers: boolean;
  onPlatformCoversChange: (value: boolean) => void;
}) {
  const ids = { covers: useId(), korapayNote: useId() };
  const tooSmallForKorapay = amount < KORAPAY_MIN_REFUND;
  const options: { value: RefundMode; label: string; hint: string }[] = [
    {
      value: "KORAPAY",
      label: "Korapay (back to the buyer's card/account)",
      hint: "Korapay sends the money back. It can take a few days to land.",
    },
    {
      value: "MANUAL",
      label: "Manual (you've already sent the money another way)",
      hint: "No money moves through Korapay. The refund completes as soon as it runs.",
    },
  ];

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium text-foreground">How the money goes back</legend>
        {options.map((option) => {
          const selected = mode === option.value;
          const blocked = option.value === "KORAPAY" && tooSmallForKorapay;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-3 transition-colors duration-state",
                "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/20",
                selected ? "border-primary/60 bg-primary/5" : "hover:bg-accent/60",
                blocked && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name="refund-mode"
                value={option.value}
                checked={selected}
                disabled={blocked}
                onChange={() => onModeChange(option.value)}
                aria-describedby={blocked ? ids.korapayNote : undefined}
                className="mt-0.5 size-4 shrink-0 accent-primary focus:outline-none"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          );
        })}
        {tooSmallForKorapay && (
          <p id={ids.korapayNote} className="text-xs text-muted-foreground">
            Korapay can&apos;t refund less than <span className="num">{formatNaira(KORAPAY_MIN_REFUND)}</span>,
            so this one has to be manual.
          </p>
        )}
      </fieldset>

      <div className="flex items-start gap-2.5 rounded-md border border-border p-3">
        <Checkbox
          id={ids.covers}
          checked={platformCovers}
          onCheckedChange={(checked) => onPlatformCoversChange(checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor={ids.covers} className="font-normal leading-snug">
          Platform covers the organizer&apos;s share if their wallet is short
        </Label>
      </div>
    </div>
  );
}
