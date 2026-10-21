"use client";

import { InlineConfirm } from "@/components/actions/inline-confirm";
import { formatCount } from "@/lib/format";
import { auditKey } from "@/services/v2/audit";
import { ticketsKey, undoCheckin, type AdminTicketDetail } from "@/services/v2/tickets";

/**
 * What can be done to a ticket now:
 *   checked in   Undo check-in (tier 1, inline confirm)
 * Kept mounted with `available`, never rendered conditionally.
 */
export function TicketActions({ ticket }: { ticket: AdminTicketDetail }) {
  const scans = ticket.scans.length;
  return (
    <InlineConfirm
      key="undo-checkin"
      // A voided ticket can't be scanned again, so there's nothing to undo.
      available={ticket.isUsed && !ticket.voidedAt}
      label="Undo check-in"
      message={
        <>
          Put ticket <span className="num">{ticket.code}</span> back to not checked in
          {scans > 0 && <> and remove its {formatCount(scans)} scan{scans === 1 ? "" : "s"}</>}? It can be
          scanned at the gate again.
        </>
      }
      confirmLabel="Undo check-in"
      invalidate={[ticketsKey, auditKey]}
      onConfirm={() => undoCheckin(ticket.id)}
      successMessage={(result) =>
        result.cacheCleared
          ? "Check-in undone. The ticket can be scanned again."
          : "Check-in undone, but the scanner's saved copy wasn't refreshed, so it may still read as used for a while."
      }
    />
  );
}
