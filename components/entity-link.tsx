import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EntityKind =
  | "transaction"
  | "refund"
  | "payout"
  | "wallet"
  | "event"
  | "organizer"
  | "user"
  | "ticket"
  | "request";

const PATHS: Record<EntityKind, string> = {
  transaction: "/transactions",
  refund: "/refunds",
  payout: "/payouts",
  // Wallets are keyed by their owner's user id.
  wallet: "/wallets",
  event: "/events",
  organizer: "/organizers",
  user: "/users",
  ticket: "/tickets",
  request: "/approvals",
};

export function entityHref(kind: EntityKind, id: string): string {
  return `${PATHS[kind]}/${encodeURIComponent(id)}`;
}

interface EntityLinkProps {
  kind: EntityKind;
  id: string;
  /** What to show; defaults to the id. */
  label?: ReactNode;
  /** Monospace, for references and codes. */
  mono?: boolean;
  className?: string;
}

/**
 * A link to another record. Long labels truncate; the full text stays in
 * `title`. Inside a DataTable row it sits above the row's own link.
 */
export function EntityLink({ kind, id, label, mono = false, className }: EntityLinkProps) {
  const text = label ?? id;
  return (
    <Link
      href={entityHref(kind, id)}
      title={typeof text === "string" ? text : undefined}
      className={cn(
        "relative z-[1] inline-block max-w-full truncate align-bottom text-foreground underline decoration-muted-foreground/50 underline-offset-[3px] transition-colors duration-state hover:decoration-foreground",
        mono && "num text-[0.95em]",
        className,
      )}
    >
      {text}
    </Link>
  );
}
