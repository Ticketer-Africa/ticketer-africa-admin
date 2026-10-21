"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

/** What the API accepts: naira with at most two decimals. */
const AMOUNT = /^\d+(\.\d{1,2})?$/;

export interface AmountRange {
  min?: string;
  max?: string;
}

function describe({ min, max }: AmountRange): string | undefined {
  const lo = min ? formatNaira(Number(min)) : undefined;
  const hi = max ? formatNaira(Number(max)) : undefined;
  if (lo && hi) return `${lo} – ${hi}`;
  if (lo) return `${lo} or more`;
  if (hi) return `Up to ${hi}`;
  return undefined;
}

interface AmountRangeFilterProps {
  value: AmountRange;
  onChange: (range: AmountRange) => void;
  label?: string;
  className?: string;
}

/** "Amount: Any" pill opening a min / max naira form. Both ends inclusive. */
export function AmountRangeFilter({
  value,
  onChange,
  label = "Amount",
  className,
}: AmountRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(value.min ?? "");
  const [max, setMax] = useState(value.max ?? "");
  const ids = { min: useId(), max: useId(), error: useId() };
  const summary = describe(value);

  const lo = min.trim();
  const hi = max.trim();
  const error =
    (lo && !AMOUNT.test(lo)) || (hi && !AMOUNT.test(hi))
      ? "Enter naira amounts like 2500 or 2500.50."
      : lo && hi && Number(lo) > Number(hi)
        ? "The minimum is more than the maximum."
        : null;

  function onOpenChange(next: boolean) {
    if (next) {
      setMin(value.min ?? "");
      setMax(value.max ?? "");
    }
    setOpen(next);
  }

  function apply(range: AmountRange) {
    onChange(range);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          aria-label={`${label}: ${summary ?? "Any"}`}
          className={cn(
            "min-w-0 max-w-full justify-start",
            summary && "border-primary/60 bg-primary/5",
            className,
          )}
        >
          <span className="text-muted-foreground">{label}</span>
          <span
            className={cn("num truncate", summary ? "font-medium text-foreground" : "text-muted-foreground")}
          >
            {summary ?? "Any"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))]">
        <form
          className="space-y-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!error) apply({ min: lo || undefined, max: hi || undefined });
          }}
        >
          <p className="text-sm font-medium text-foreground">Amount paid (₦)</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={ids.min} className="text-xs text-muted-foreground">
                At least
              </Label>
              <Input
                id={ids.min}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={min}
                onChange={(event) => setMin(event.target.value)}
                aria-invalid={Boolean(lo && error) || undefined}
                aria-describedby={error ? ids.error : undefined}
                className="num"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={ids.max} className="text-xs text-muted-foreground">
                At most
              </Label>
              <Input
                id={ids.max}
                inputMode="decimal"
                autoComplete="off"
                placeholder="No limit"
                value={max}
                onChange={(event) => setMax(event.target.value)}
                aria-invalid={Boolean(hi && error) || undefined}
                aria-describedby={error ? ids.error : undefined}
                className="num"
              />
            </div>
          </div>
          {error && (
            <p id={ids.error} className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            {summary && (
              <Button type="button" variant="muted" size="sm" onClick={() => apply({})}>
                Clear
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm" disabled={Boolean(error)}>
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
