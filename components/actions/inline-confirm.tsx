"use client";

import { useRef, useState, type ReactNode } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { focusPageHeading } from "@/lib/focus-return";
import { useAdminAction, useKeepFocusWhenHidden } from "./use-admin-action";

/*
 * Tier 1 actions with a side effect (sends an email, flips a state): one
 * button, then a small confirm anchored to it. "Resend tickets to
 * buyer@x?  [Cancel] [Resend]". No reason, no sheet.
 *
 * Like ActionSheet, keep it mounted with a stable key and pass `available`
 * rather than rendering it conditionally, so a confirm that fails because
 * the record changed keeps its error and never turns into another action.
 */

interface InlineConfirmProps {
  /** The button text: "Resend tickets". */
  label: string;
  /** The question: "Resend tickets to buyer@x?" Defaults to `${label}?`. */
  message?: ReactNode;
  /** The confirm button text. Defaults to the label. */
  confirmLabel?: string;
  onConfirm: () => Promise<unknown>;
  invalidate?: QueryKey[];
  successMessage?: string;
  icon?: IconSvgElement;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  disabled?: boolean;
  /** Whether the action applies to the record as it is now. */
  available?: boolean;
  className?: string;
}

export function InlineConfirm({
  label,
  message,
  confirmLabel,
  onConfirm,
  invalidate,
  successMessage = "Done",
  icon,
  variant = "secondary",
  size,
  disabled,
  available = true,
  className,
}: InlineConfirmProps) {
  const [open, setOpen] = useState(false);
  const action = useAdminAction({ invalidate });
  const triggerRef = useRef<HTMLButtonElement>(null);
  useKeepFocusWhenHidden(available, triggerRef);

  function onOpenChange(next: boolean) {
    if (!next && action.isPending) return;
    // A fresh open unlocks; closing keeps a finished action locked so a
    // click on the fading confirm can't send it again.
    if (next) action.reset();
    setOpen(next);
  }

  async function confirm() {
    if (!available || action.isDone) return;
    const result = await action.run(onConfirm);
    if (result?.ok) {
      toast.success(successMessage);
      setOpen(false);
    }
  }

  // Hidden once it no longer applies, unless it's open showing why it failed.
  if (!available && !open) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button ref={triggerRef} variant={variant} size={size} disabled={disabled} className={className}>
          {icon && <HugeiconsIcon icon={icon} />}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(20rem,calc(100vw-2rem))] space-y-3"
        onCloseAutoFocus={(event) => {
          if (!triggerRef.current?.isConnected && focusPageHeading()) event.preventDefault();
        }}
      >
        <p className="text-sm text-foreground">{message ?? `${label}?`}</p>
        {!available && (
          <p className="text-sm text-muted-foreground">This no longer applies: the record changed.</p>
        )}
        {action.error && (
          <p role="alert" className="break-words text-sm text-destructive">
            {action.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={action.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={confirm}
            loading={action.isPending}
            disabled={!available || action.isDone}
          >
            {confirmLabel ?? label}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
