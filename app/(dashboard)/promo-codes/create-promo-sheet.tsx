"use client";

import { useId, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { ActionSheet } from "@/components/actions/action-sheet";
import { EventPicker, type PickedEvent } from "@/components/event-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { formatCount } from "@/lib/format";
import { auditKey } from "@/services/v2/audit";
import {
  createDiscount,
  DISCOUNT_LIMIT_MAX,
  discountsKey,
  type DiscountType,
} from "@/services/v2/discounts";

const CODE_PATTERN = /^[A-Za-z0-9_-]{3,20}$/;
const TYPE_OPTIONS = [
  { value: "PERCENT", label: "Percent off" },
  { value: "FLAT", label: "Fixed amount" },
] as const;

/** Naira with at most 2 decimals, ≥ 1. Null when the text isn't one. */
function nairaAmount(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value >= 1 ? value : null;
}

function wholeNumber(text: string): number | null {
  return /^\d+$/.test(text.trim()) ? Number(text.trim()) : null;
}

/**
 * "New promo code" button and its sheet (tier 1: no reason, just do it).
 * Checks the same rules as the backend so mistakes show before sending;
 * the backend still has the last word and its message is shown as-is.
 */
export function CreatePromoSheet() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickedEvent | undefined>();
  const [code, setCode] = useState("");
  const [type, setType] = useState<DiscountType>("PERCENT");
  const [valueText, setValueText] = useState("");
  const [limitText, setLimitText] = useState("");
  const [touched, setTouched] = useState({ code: false, value: false, limit: false });
  const ids = { code: useId(), value: useId(), limit: useId(), event: useId() };

  const codeValid = CODE_PATTERN.test(code);
  const percent = wholeNumber(valueText);
  const flat = nairaAmount(valueText);
  const valueValid = type === "PERCENT" ? percent !== null && percent >= 1 && percent <= 100 : flat !== null;
  const limit = wholeNumber(limitText);
  const limitBlank = limitText.trim() === "";
  const limitValid = limitBlank || (limit !== null && limit >= 1 && limit <= DISCOUNT_LIMIT_MAX);

  const codeError = !touched.code
    ? null
    : !codeValid
      ? "3 to 20 characters: letters, numbers, - and _."
      : null;
  const valueError = !touched.value || valueValid
    ? null
    : type === "PERCENT"
      ? "A whole number from 1 to 100."
      : "At least ₦1, with up to 2 decimals.";
  const limitError = !touched.limit || limitValid
    ? null
    : `A whole number from 1 to ${formatCount(DISCOUNT_LIMIT_MAX)}, or leave empty for no limit.`;

  function openSheet(next: boolean) {
    if (next) {
      setPicked(undefined);
      setCode("");
      setType("PERCENT");
      setValueText("");
      setLimitText("");
      setTouched({ code: false, value: false, limit: false });
    }
    setOpen(next);
  }

  const invalid = (message: string | null) => Boolean(message) || undefined;

  return (
    <>
      <Button variant="primary" onClick={() => openSheet(true)}>
        <HugeiconsIcon icon={Add01Icon} />
        New promo code
      </Button>
      <ActionSheet
        key="create"
        open={open}
        onOpenChange={openSheet}
        tier={1}
        title="New promo code"
        description="Buyers type the code at checkout. It applies to one event."
        confirmLabel="Create promo code"
        successMessage="Promo code created"
        invalidate={[discountsKey, auditKey]}
        canSubmit={Boolean(picked) && codeValid && valueValid && limitValid}
        onSubmit={() => {
          setTouched({ code: true, value: true, limit: true });
          return createDiscount({
            eventId: (picked as PickedEvent).id,
            code: code.trim().toUpperCase(),
            type,
            value: type === "PERCENT" ? (percent as number) : (flat as number),
            ...(limit !== null && { usageLimit: limit }),
          });
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label id={ids.event}>Event</Label>
            <div role="group" aria-labelledby={ids.event}>
              <EventPicker value={picked} onChange={setPicked} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={ids.code}>Code</Label>
            <Input
              id={ids.code}
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              onBlur={() => setTouched((t) => ({ ...t, code: true }))}
              maxLength={20}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="SAVE20"
              aria-invalid={invalid(codeError)}
              aria-describedby={`${ids.code}-hint`}
              className="num"
            />
            <p id={`${ids.code}-hint`} className={codeError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {codeError ?? "Letters, numbers, - and _. Saved in capitals."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label id={`${ids.value}-type`}>Discount</Label>
            <Segmented
              block
              aria-label="Discount type"
              value={type}
              onValueChange={(next) => {
                setType(next);
                setValueText("");
                setTouched((t) => ({ ...t, value: false }));
              }}
              options={TYPE_OPTIONS}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={ids.value}>{type === "PERCENT" ? "Percent off" : "Amount off (₦)"}</Label>
            <Input
              id={ids.value}
              inputMode="decimal"
              autoComplete="off"
              value={valueText}
              onChange={(event) => setValueText(event.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, value: true }))}
              placeholder={type === "PERCENT" ? "20" : "500"}
              aria-invalid={invalid(valueError)}
              aria-describedby={`${ids.value}-hint`}
              className="num"
            />
            <p id={`${ids.value}-hint`} className={valueError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {valueError ??
                (type === "PERCENT"
                  ? "A whole number from 1 to 100."
                  : "In naira, taken off the ticket price.")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={ids.limit}>Usage limit (optional)</Label>
            <Input
              id={ids.limit}
              inputMode="numeric"
              autoComplete="off"
              value={limitText}
              onChange={(event) => setLimitText(event.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, limit: true }))}
              placeholder="No limit"
              aria-invalid={invalid(limitError)}
              aria-describedby={`${ids.limit}-hint`}
              className="num"
            />
            <p id={`${ids.limit}-hint`} className={limitError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {limitError ?? "How many times it can be used in total. Empty means no limit."}
            </p>
          </div>
        </div>
      </ActionSheet>
    </>
  );
}
