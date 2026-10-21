"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KORAPAY_MIN_REFUND, type RefundMode } from "@/services/v2/refunds";

/**
 * How refunded money goes back (Korapay or manual), and whether the platform
 * covers an organizer who can't repay. Shared by the single refund and the
 * event-wide refund. Pass `amount` to block Korapay under its minimum.
 */
export function RefundModeOptions({
  amount,
  mode,
  onModeChange,
  platformCovers,
  onPlatformCoversChange,
}: {
  amount?: number;
  mode: RefundMode | null;
  onModeChange: (mode: RefundMode) => void;
  platformCovers: boolean;
  onPlatformCoversChange: (value: boolean) => void;
}) {
  const ids = { covers: useId(), korapayNote: useId() };
  const tooSmallForKorapay = amount !== undefined && amount < KORAPAY_MIN_REFUND;
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
