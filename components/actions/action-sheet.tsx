"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { entityHref } from "@/components/entity-link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { requestsKey } from "@/services/v2/requests";
import { useAdminAction } from "./use-admin-action";

/*
 * Tier 2 (confirm + reason) and tier 3 (request approval) actions, plus
 * tier 1 actions that need a form. Right-hand sheet from 768px, bottom
 * sheet on phones. The sheet stays open on error, shows the backend's
 * message, and refetches `invalidate` so the page shows the record's real
 * state. Submitting twice sends one request.
 *
 * Keep every ActionSheet mounted and pass `available` (is this action valid
 * for the record right now?) instead of rendering it conditionally. After a
 * failed action the refetch often makes it invalid (someone else already
 * suspended the user); an unmounted sheet would vanish with its error, and
 * swapping one sheet for another in the same spot would let React reuse
 * the open sheet, reason and all, for a different action.
 */

export type ActionTier = 1 | 2 | 3;

/** What an Actions menu shows next to each item. Tier 1 gets nothing. */
export const TIER_HINT: Record<ActionTier, string | null> = {
  1: null,
  2: "Needs a reason",
  3: "Needs approval",
};

const REASON_MIN = 10;
const SELF_APPROVE_REASON_MIN = 20;

export interface ActionSheetExtra {
  /** The person ticked "approve my own request". */
  selfApprove: boolean;
}

interface ActionSheetProps {
  tier: ActionTier;
  /** "Suspend Ada Obi". */
  title: string;
  /** One line: what will happen. */
  description?: ReactNode;
  /** The facts being acted on (amount, record, consequences). */
  summary?: ReactNode;
  /** Defaults to "Request approval" for tier 3, else the title. */
  confirmLabel?: string;
  /** Crimson confirm button for actions that take something away. */
  destructive?: boolean;
  /**
   * Does the work. Tier 3 must resolve to the created request (`{ id }`,
   * e.g. from `createAdminRequest`) so the toast can link to it.
   */
  onSubmit: (reason: string, extra: ActionSheetExtra) => Promise<unknown>;
  /** Queries to refetch after success or failure. */
  invalidate?: QueryKey[];
  /** Toast on success. */
  successMessage?: string;
  /** Offer self-approval (a SUPERADMIN approving their own request). */
  selfApprove?: boolean;
  /** Extra fields shown above the reason (role picker, refund mode, …). */
  children?: ReactNode;
  /** False while the extra fields aren't valid yet. */
  canSubmit?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** The button that opens the sheet (uncontrolled use). */
  trigger?: ReactNode;
  /**
   * Whether the action applies to the record as it is now. False hides the
   * trigger; an already open sheet stays (with its error) but can't submit.
   */
  available?: boolean;
  /** Controlled use, e.g. opened from an Actions menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ActionSheet({
  tier,
  title,
  description,
  summary,
  confirmLabel,
  destructive = false,
  onSubmit,
  invalidate = [],
  successMessage,
  selfApprove = false,
  children,
  canSubmit = true,
  reasonLabel = "Reason",
  reasonPlaceholder = "Why are you doing this? It goes in the audit log.",
  trigger,
  available = true,
  open: openProp,
  onOpenChange,
}: ActionSheetProps) {
  const router = useRouter();
  const wide = useMediaQuery("(min-width: 768px)");
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const [reason, setReason] = useState("");
  const [selfApproving, setSelfApproving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ids = { reason: useId(), count: useId(), error: useId(), self: useId() };

  const keys = tier === 3 ? [...invalidate, requestsKey] : invalidate;
  const action = useAdminAction({ invalidate: keys });

  const needsReason = tier >= 2;
  const min = selfApproving ? SELF_APPROVE_REASON_MIN : REASON_MIN;
  const length = reason.trim().length;
  const reasonShort = needsReason && length < min;

  // Cleared once the sheet has finished closing, so the next open starts
  // empty however it's opened (trigger, or a controlled `open` from an
  // Actions menu), without the text vanishing mid-slide.
  function resetForm() {
    setReason("");
    setSelfApproving(false);
    setTriedSubmit(false);
    action.reset();
  }

  function setOpen(next: boolean) {
    // Don't let a half-sent action vanish.
    if (!next && action.isPending) return;
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (action.isPending) return;
    setTriedSubmit(true);
    if (reasonShort) {
      reasonRef.current?.focus();
      return;
    }
    if (!canSubmit || !available) return;

    const result = await action.run(() =>
      onSubmit(reason.trim(), { selfApprove: selfApproving }),
    );
    if (!result?.ok) return;

    if (tier === 3) {
      const id = (result.data as { id?: string } | undefined)?.id;
      toast.success(successMessage ?? "Approval requested", {
        description: "It's in Approvals until another superadmin decides.",
        action: id
          ? { label: "View request", onClick: () => router.push(entityHref("request", id)) }
          : undefined,
      });
    } else {
      toast.success(successMessage ?? "Done");
    }
    setOpen(false);
  }

  const counterText = reasonShort
    ? `${min - length} more character${min - length === 1 ? "" : "s"} needed (at least ${min})`
    : `${length} characters`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && available && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side={wide ? "right" : "bottom"}
        className={cn(wide && "sm:max-w-[28rem]")}
        onCloseAutoFocus={resetForm}
        onOpenAutoFocus={(event) => {
          // Land in the reason box; otherwise the first field.
          if (needsReason && reasonRef.current) {
            event.preventDefault();
            reasonRef.current.focus();
          }
        }}
      >
        <form ref={formRef} onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : (
              <SheetDescription className="sr-only">{TIER_HINT[tier] ?? title}</SheetDescription>
            )}
          </SheetHeader>

          <SheetBody className="space-y-4">
            {summary && (
              <div className="rounded-md border border-border bg-surface p-3 text-sm">{summary}</div>
            )}

            {children}

            {needsReason && (
              <div className="space-y-1.5">
                <Label htmlFor={ids.reason}>{reasonLabel}</Label>
                <Textarea
                  ref={reasonRef}
                  id={ids.reason}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                  placeholder={reasonPlaceholder}
                  rows={4}
                  maxLength={500}
                  aria-invalid={(triedSubmit && reasonShort) || undefined}
                  aria-describedby={ids.count}
                  required
                />
                <p
                  id={ids.count}
                  className={cn(
                    "text-xs tabular-nums",
                    triedSubmit && reasonShort ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {counterText}
                </p>
              </div>
            )}

            {selfApprove && (
              <div className="flex items-start gap-2.5 rounded-md border border-border p-3">
                <Checkbox
                  id={ids.self}
                  checked={selfApproving}
                  onCheckedChange={(checked) => setSelfApproving(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label htmlFor={ids.self}>Approve my own request</Label>
                  <p className="text-xs text-muted-foreground">
                    Needs a reason of at least {SELF_APPROVE_REASON_MIN} characters. Every other
                    superadmin gets an email saying you did this.
                  </p>
                </div>
              </div>
            )}

            {action.error && (
              <div
                id={ids.error}
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <p className="min-w-0 break-words">{action.error.message}</p>
              </div>
            )}
            {!available && (
              <p className="text-sm text-muted-foreground">
                This no longer applies: the record changed since you opened this. Close the sheet
                to see where it stands.
              </p>
            )}
          </SheetBody>

          <SheetFooter className="flex-col sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {tier === 3
                ? "Nothing happens until another superadmin approves."
                : tier === 2
                  ? "Recorded in the audit log with your reason."
                  : "Recorded in the audit log."}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={action.isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={destructive ? "destructive" : "primary"}
                loading={action.isPending}
                disabled={!canSubmit || !available}
                aria-describedby={action.error ? ids.error : undefined}
              >
                {confirmLabel ?? (tier === 3 ? "Request approval" : title)}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
