"use client";

import { useId, useState } from "react";
import { ActionSheet } from "@/components/actions/action-sheet";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCount } from "@/lib/format";
import { auditKey } from "@/services/v2/audit";
import {
  DISCOUNT_LIMIT_MAX,
  disableDiscount,
  discountsKey,
  enableDiscount,
  updateDiscountLimit,
  type AdminDiscountRow,
} from "@/services/v2/discounts";

/** Whole number from an input's text, or null when it isn't one. */
function wholeNumber(text: string): number | null {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

/**
 * What can be done to a promo code now (all tier 1, no reason needed):
 *   any            Edit limit (sheet)
 *   active         Disable (inline confirm)
 *   disabled       Enable (inline confirm)
 * Everything stays mounted with `available`, never rendered conditionally.
 */
export function PromoRowActions({ discount }: { discount: AdminDiscountRow }) {
  const [unlimited, setUnlimited] = useState(discount.usageLimit === null);
  const [limitText, setLimitText] = useState(discount.usageLimit === null ? "" : String(discount.usageLimit));
  const ids = { limit: useId(), hint: useId() };

  const parsed = wholeNumber(limitText);
  const tooLow = !unlimited && parsed !== null && parsed < discount.usedCount;
  const tooHigh = !unlimited && parsed !== null && parsed > DISCOUNT_LIMIT_MAX;
  const valid = unlimited || (parsed !== null && parsed >= Math.max(1, discount.usedCount) && !tooHigh);
  const error = unlimited
    ? null
    : limitText.trim() === ""
      ? "Enter a limit, or choose no limit."
      : parsed === null
        ? "Use a whole number."
        : tooLow
          ? `It's been used ${formatCount(discount.usedCount)} time${discount.usedCount === 1 ? "" : "s"}, so the limit can't be lower than that.`
          : parsed < 1
            ? "The limit must be at least 1."
            : tooHigh
              ? `The most you can set is ${formatCount(DISCOUNT_LIMIT_MAX)}.`
              : null;

  function onOpenChange(next: boolean) {
    // Start from the code as it is now each time the sheet opens.
    if (next) {
      setUnlimited(discount.usageLimit === null);
      setLimitText(discount.usageLimit === null ? "" : String(discount.usageLimit));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActionSheet
        key="edit-limit"
        tier={1}
        title={`Edit limit for ${discount.code}`}
        description={
          <>
            Used <span className="num">{formatCount(discount.usedCount)}</span> time
            {discount.usedCount === 1 ? "" : "s"} so far for {discount.event.name}.
          </>
        }
        confirmLabel="Save limit"
        successMessage="Usage limit updated"
        invalidate={[discountsKey, auditKey]}
        canSubmit={valid}
        onOpenChange={onOpenChange}
        onSubmit={() => updateDiscountLimit(discount.id, unlimited ? null : parsed)}
        trigger={
          <Button variant="secondary" size="sm" aria-label={`Edit limit for ${discount.code}`}>
            Edit limit
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={ids.limit}>Times it can be used</Label>
            <Input
              id={ids.limit}
              inputMode="numeric"
              autoComplete="off"
              value={limitText}
              disabled={unlimited}
              onChange={(event) => setLimitText(event.target.value)}
              aria-invalid={Boolean(error && limitText.trim() !== "") || undefined}
              aria-describedby={ids.hint}
              className="num"
            />
            <p id={ids.hint} className={error && limitText.trim() !== "" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {error && limitText.trim() !== ""
                ? error
                : `Between ${formatCount(Math.max(1, discount.usedCount))} and ${formatCount(DISCOUNT_LIMIT_MAX)}.`}
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id={`${ids.limit}-none`}
              checked={unlimited}
              onCheckedChange={(checked) => setUnlimited(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor={`${ids.limit}-none`} className="font-normal leading-snug">
              No limit
            </Label>
          </div>
        </div>
      </ActionSheet>

      <InlineConfirm
        key="disable"
        available={!discount.disabledAt}
        label="Disable"
        size="sm"
        className="min-w-[4.5rem]"
        message={
          <>
            Stop <span className="num">{discount.code}</span> from working at checkout? Buyers who
            already used it keep their discount. You can enable it again.
          </>
        }
        confirmLabel="Disable"
        invalidate={[discountsKey, auditKey]}
        onConfirm={() => disableDiscount(discount.id)}
        successMessage={`${discount.code} disabled`}
      />
      <InlineConfirm
        key="enable"
        available={Boolean(discount.disabledAt)}
        label="Enable"
        size="sm"
        className="min-w-[4.5rem]"
        message={
          <>
            Let buyers use <span className="num">{discount.code}</span> at checkout again?
          </>
        }
        confirmLabel="Enable"
        invalidate={[discountsKey, auditKey]}
        onConfirm={() => enableDiscount(discount.id)}
        successMessage={`${discount.code} enabled`}
      />
    </div>
  );
}
