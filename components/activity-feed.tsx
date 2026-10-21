"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { EntityLink, type EntityKind } from "@/components/entity-link";
import { auditChanges, humanizeAction } from "@/lib/audit-values";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditEntry } from "@/services/v2/types";

/** What each audit action reads as after the actor's name. */
const ACTION_LABELS: Record<string, string> = {
  "user.suspended": "suspended the account",
  "user.unsuspended": "lifted the suspension",
  "user.role_changed": "changed the role",
  "user.otp_resent": "resent the sign-up code",
  "organizer.verified": "verified the organizer",
  "organizer.unverified": "removed organizer verification",
  "event.activated": "turned the event on",
  "event.deactivated": "turned the event off",
  "event.toggled": "turned the event on or off",
  "event.updated": "edited the event",
  "event.fees_changed": "changed the event's fees",
  "event.cancelled": "cancelled the event",
  "transaction.rechecked": "re-checked the payment with Korapay",
  "transaction.marked_failed": "marked the payment failed",
  "transaction.recovered": "recovered the payment",
  "transaction.tickets_resent": "resent the tickets",
  "refund.started": "started a refund",
  "refund.completed": "completed a refund",
  "refund.failed": "saw a refund fail",
  "refund.processing": "sent the refund to Korapay",
  "refund.rechecked": "re-checked the refund with Korapay",
  "refund.success_after_failure": "saw Korapay pay a refund after it had failed",
  "refund.not_found_alerted": "was alerted that Korapay has no record of the refund",
  "ticket.checkin_undone": "undid the check-in",
  "payout.rechecked": "re-checked the payout with Korapay",
  "payout.force_failed": "forced the payout to failed",
  "payouts.paused": "paused payouts",
  "payouts.resumed": "resumed payouts",
  "destination.approved": "approved the bank details",
  "destination.rejected": "rejected the bank details",
  "destination.refreshed": "refreshed the bank details",
  "discount.created": "created a promo code",
  "discount.updated": "changed a promo code",
  "discount.disabled": "disabled a promo code",
  "discount.enabled": "enabled a promo code",
  "wallet.adjusted": "adjusted the wallet",
  "request.created": "asked for approval",
  "request.approved": "approved the request",
  "request.self_approved": "approved their own request",
  "request.rejected": "rejected the request",
  "request.cancelled": "cancelled the request",
  "request.executed": "carried out the approved request",
  "request.failed": "saw the approved request fail",
  "request.retried": "retried the request",
  "refund_all.transaction_failed": "saw one refund in a refund-all fail",
};

/** Every action the audit log can be filtered by. */
export const AUDIT_ACTIONS = Object.keys(ACTION_LABELS);

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanizeAction(action).toLowerCase();
}

const TARGET_KINDS: Record<string, EntityKind> = {
  user: "user",
  organizer: "organizer",
  event: "event",
  transaction: "transaction",
  refund: "refund",
  payout: "payout",
  wallet: "wallet",
  ticket: "ticket",
  request: "request",
};

interface ActivityFeedProps {
  entries: AuditEntry[];
  /** Link each entry to its record (for feeds that span records). */
  showTarget?: boolean;
  emptyText?: string;
  className?: string;
}

/** Who did what, why and when, newest first, with the change on demand. */
export function ActivityFeed({
  entries,
  showTarget = false,
  emptyText = "No admin activity on this record yet.",
  className,
}: ActivityFeedProps) {
  if (!entries.length) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{emptyText}</p>;
  }
  return (
    <ol className={cn("divide-y divide-border", className)}>
      {entries.map((entry) => (
        <ActivityItem key={entry.id} entry={entry} showTarget={showTarget} />
      ))}
    </ol>
  );
}

function ActivityItem({ entry, showTarget }: { entry: AuditEntry; showTarget: boolean }) {
  const [open, setOpen] = useState(false);
  const changes = auditChanges(entry.before, entry.after);
  const targetKind = TARGET_KINDS[entry.targetType];
  const detailsId = `activity-${entry.id}-changes`;

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <p className="min-w-0 text-sm text-foreground">
          <span className="font-medium">{entry.actor?.name ?? "An admin"}</span>{" "}
          {actionLabel(entry.action)}
          {showTarget && targetKind && entry.targetId && (
            <>
              {" · "}
              <EntityLink kind={targetKind} id={entry.targetId} mono className="text-xs" />
            </>
          )}
        </p>
        <time
          dateTime={entry.createdAt}
          title={formatDateTime(entry.createdAt)}
          className="num shrink-0 text-xs text-muted-foreground"
        >
          {formatRelative(entry.createdAt)}
        </time>
      </div>
      {entry.reason && (
        <p className="mt-1 break-words text-sm text-muted-foreground">
          &ldquo;{entry.reason}&rdquo;
        </p>
      )}
      {changes.length > 0 && (
        <div className="mt-1.5">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground transition-colors duration-state hover:text-foreground"
          >
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              aria-hidden="true"
              className={cn("size-3.5 transition-transform duration-state", open && "rotate-90")}
            />
            {open ? "Hide changes" : "Show changes"}
          </button>
          {open && (
            <dl
              id={detailsId}
              className="mt-2 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md bg-muted px-3 py-2 text-xs"
            >
              {changes.map((change) => (
                <div key={change.key} className="contents">
                  <dt className="text-muted-foreground">{change.label}</dt>
                  <dd className="num min-w-0 break-words text-foreground">
                    {change.before === change.after ? (
                      change.after
                    ) : (
                      <>
                        <span className="text-muted-foreground">{change.before}</span>
                        <span aria-hidden="true"> → </span>
                        <span className="sr-only"> changed to </span>
                        {change.after}
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </li>
  );
}
