"use client";

import { useId, useState } from "react";
import { ActionSheet } from "@/components/actions/action-sheet";
import { ActionsMenu, type ActionsMenuItem } from "@/components/actions/actions-menu";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCount } from "@/lib/format";
import { auditKey } from "@/services/v2/audit";
import { resendTicket, ticketsKey, undoCheckin, type AdminTicketDetail } from "@/services/v2/tickets";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * What can be done to a ticket now:
 *   checked in   Undo check-in (tier 1, inline confirm)
 *   not voided   Resend ticket (tier 1), Correct email & resend (tier 2)
 * Kept mounted with `available`, never rendered conditionally.
 */
export function TicketActions({ ticket }: { ticket: AdminTicketDetail }) {
  const scans = ticket.scans.length;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [email, setEmail] = useState("");
  const emailId = useId();

  const live = !ticket.voidedAt;
  // Assigned tickets go to the recipient; otherwise to the owner's account.
  const sendsTo = ticket.recipientEmail ?? ticket.owner.email;
  const whose = ticket.recipientEmail ? "recipient's" : "owner's account";
  const corrected = email.trim().toLowerCase();
  const emailValid = EMAIL_PATTERN.test(corrected) && corrected !== sendsTo.toLowerCase();

  const items: ActionsMenuItem[] = live ? [{ key: "correct-email", label: "Correct email & resend", tier: 2 }] : [];

  return (
    <>
      <InlineConfirm
        key="undo-checkin"
        // A voided ticket can't be scanned again, so there's nothing to undo.
        available={ticket.isUsed && live}
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
      <InlineConfirm
        key="resend"
        available={live}
        label="Resend ticket"
        message={
          <>
            Email ticket <span className="num">{ticket.code}</span> to{" "}
            <span className="num break-all">{sendsTo}</span> again?
          </>
        }
        confirmLabel="Resend"
        invalidate={[auditKey]}
        onConfirm={() => resendTicket(ticket.id)}
        successMessage={(result) => `Ticket sent to ${result.sentTo}`}
      />

      <ActionsMenu
        items={items}
        onSelect={() => {
          setEmail("");
          setSheetOpen(true);
        }}
      />

      <ActionSheet
        key="correct-email"
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tier={2}
        available={live}
        title="Correct email & resend"
        description={
          <>
            Replaces the {whose} email <span className="num break-all">{sendsTo}</span>, then emails the ticket to
            the new address.
            {!ticket.recipientEmail && " The owner signs in with the new email from now on."}
          </>
        }
        confirmLabel="Save & resend"
        canSubmit={emailValid}
        invalidate={[ticketsKey, auditKey]}
        successMessage="Email corrected and ticket sent"
        onSubmit={(reason) => resendTicket(ticket.id, { email: corrected, reason })}
      >
        <div className="space-y-1.5">
          <Label htmlFor={emailId}>Correct email</Label>
          <Input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="off"
            spellCheck={false}
            placeholder="name@gmail.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </ActionSheet>
    </>
  );
}
