import { Badge, type BadgeProps } from "@/components/ui/badge";

/*
 * One place that decides what every backend status looks like, so "FAILED"
 * is the same crimson on a transaction, a payout and a request.
 *   success     finished well (paid, completed, executed, approved account)
 *   warning     waiting on someone or something (pending, needs review)
 *   info        in motion (processing, approved and about to run)
 *   destructive went wrong or blocked (failed, suspended, cancelled event)
 *   neutral     closed without harm (refunded, rejected, cancelled request)
 */

type Tone = NonNullable<BadgeProps["variant"]>;
type Entry = [label: string, tone: Tone];

export type StatusKind =
  | "transaction"
  | "refund"
  | "payout"
  | "event"
  | "request"
  | "user"
  | "destination";

const STATUSES: Record<StatusKind, Record<string, Entry>> = {
  transaction: {
    PENDING: ["Pending", "warning"],
    SUCCESS: ["Successful", "success"],
    FAILED: ["Failed", "destructive"],
    REFUNDED: ["Refunded", "neutral"],
  },
  refund: {
    PENDING: ["Pending", "warning"],
    PROCESSING: ["Processing", "info"],
    COMPLETED: ["Completed", "success"],
    FAILED: ["Failed", "destructive"],
  },
  payout: {
    PENDING: ["Pending", "warning"],
    PROCESSING: ["Processing", "info"],
    COMPLETED: ["Completed", "success"],
    FAILED: ["Failed", "destructive"],
  },
  event: {
    ACTIVE: ["Active", "success"],
    LIVE: ["Live", "success"],
    UPCOMING: ["Upcoming", "info"],
    INACTIVE: ["Off", "neutral"],
    PAST: ["Past", "neutral"],
    CANCELLED: ["Cancelled", "destructive"],
  },
  request: {
    PENDING: ["Waiting for approval", "warning"],
    APPROVED: ["Approved", "info"],
    EXECUTED: ["Done", "success"],
    FAILED: ["Failed", "destructive"],
    REJECTED: ["Rejected", "neutral"],
    CANCELLED: ["Cancelled", "neutral"],
  },
  user: {
    ACTIVE: ["Active", "success"],
    UNVERIFIED: ["Unverified", "warning"],
    SUSPENDED: ["Suspended", "destructive"],
  },
  destination: {
    PENDING_REVIEW: ["Needs review", "warning"],
    APPROVED: ["Approved", "success"],
    REJECTED: ["Rejected", "destructive"],
    DEACTIVATED: ["Deactivated", "neutral"],
  },
};

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

/** The label and tone for a status, for places that can't render a badge. */
export function statusMeta(kind: StatusKind, value: string): { label: string; tone: Tone } {
  const entry = STATUSES[kind][value.toUpperCase()];
  return entry ? { label: entry[0], tone: entry[1] } : { label: titleCase(value), tone: "neutral" };
}

interface StatusBadgeProps {
  kind: StatusKind;
  value: string;
  className?: string;
}

export function StatusBadge({ kind, value, className }: StatusBadgeProps) {
  const { label, tone } = statusMeta(kind, value);
  return (
    <Badge variant={tone} dot className={className}>
      {label}
    </Badge>
  );
}

/** A user's single status: suspended beats unverified beats active. */
export function userStatus(user: { suspendedAt: string | null; isVerified: boolean }) {
  if (user.suspendedAt) return "SUSPENDED";
  return user.isVerified ? "ACTIVE" : "UNVERIFIED";
}
