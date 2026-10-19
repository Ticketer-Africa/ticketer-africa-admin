"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DATE_PRESETS,
  isDay,
  matchPreset,
  presetRange,
  type DatePreset,
  type DateRange,
} from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type { DateRange, DatePreset };

/** "Last 30 days", or "1 Oct 2026 – 19 Oct 2026" for a custom range. */
export function describeRange(range: DateRange): string {
  const preset = matchPreset(range);
  if (preset !== "custom") return DATE_PRESETS.find((p) => p.id === preset)!.label;
  if (range.from && range.to) {
    return range.from === range.to
      ? formatDate(range.from)
      : `${formatDate(range.from)} – ${formatDate(range.to)}`;
  }
  if (range.from) return `From ${formatDate(range.from)}`;
  return `Until ${formatDate(range.to)}`;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Prefix on the trigger, e.g. "Joined". */
  label?: string;
  /** Limit the presets (analytics has no "All time"). */
  presets?: DatePreset[];
  className?: string;
}

/**
 * Presets plus a custom from/to, as Lagos calendar days. The value is plain
 * { from, to } (YYYY-MM-DD) so it drops straight into the URL and the API.
 */
export function DateRangePicker({
  value,
  onChange,
  label,
  presets,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(value.from ?? "");
  const [to, setTo] = useState(value.to ?? "");
  const fromId = useId();
  const toId = useId();
  const errorId = useId();

  const options = presets ? DATE_PRESETS.filter((p) => presets.includes(p.id)) : DATE_PRESETS;
  const active = matchPreset(value);
  const isAllTime = !value.from && !value.to;

  const customError =
    (from && !isDay(from)) || (to && !isDay(to))
      ? "Enter dates as YYYY-MM-DD."
      : from && to && from > to
        ? "The start date is after the end date."
        : !from && !to
          ? "Pick at least one date."
          : null;

  function onOpenChange(next: boolean) {
    if (next) {
      setFrom(value.from ?? "");
      setTo(value.to ?? "");
    }
    setOpen(next);
  }

  function choose(range: DateRange) {
    onChange(range);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            "min-w-0 max-w-full justify-start",
            label && !isAllTime && "border-primary/60 bg-primary/5",
            className,
          )}
        >
          <HugeiconsIcon icon={Calendar03Icon} className="text-muted-foreground" />
          {label && <span className="text-muted-foreground">{label}</span>}
          <span className="truncate">{describeRange(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="grid grid-cols-2 gap-1 border-b border-border p-2">
          {options.map((preset) => {
            const selected = active === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => choose(presetRange(preset.id))}
                className={cn(
                  "flex h-9 items-center justify-between gap-2 rounded-md px-2 text-left text-sm text-foreground transition-colors duration-state hover:bg-accent md:h-8",
                  selected && "bg-accent font-medium",
                )}
              >
                {preset.label}
                {selected && <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>
        <form
          className="space-y-3 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!customError) choose({ from: from || undefined, to: to || undefined });
          }}
        >
          <p className="text-sm font-medium text-foreground">Custom range</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={fromId} className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id={fromId}
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
                aria-invalid={Boolean(from && customError) || undefined}
                aria-describedby={customError ? errorId : undefined}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={toId} className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id={toId}
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
                aria-invalid={Boolean(to && customError) || undefined}
                aria-describedby={customError ? errorId : undefined}
              />
            </div>
          </div>
          {customError && (from || to) && (
            <p id={errorId} className="text-xs text-destructive">
              {customError}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" disabled={Boolean(customError)}>
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A date range kept in the URL as `from`/`to` (or other keys), for pages
 * that aren't lists. A missing range means `defaultPreset` (computed today).
 */
export function useUrlDateRange({
  fromKey = "from",
  toKey = "to",
  defaultPreset = "30d",
}: { fromKey?: string; toKey?: string; defaultPreset?: DatePreset } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const range = useMemo<DateRange>(() => {
    const search = new URLSearchParams(query);
    const from = search.get(fromKey) ?? undefined;
    const to = search.get(toKey) ?? undefined;
    if (search.get(fromKey) === null && search.get(toKey) === null) {
      return presetRange(defaultPreset);
    }
    return { from: isDay(from) ? from : undefined, to: isDay(to) ? to : undefined };
  }, [query, fromKey, toKey, defaultPreset]);

  const setRange = useCallback(
    (next: DateRange) => {
      const search = new URLSearchParams(query);
      // All time is written as empty keys so it isn't mistaken for the default.
      search.set(fromKey, next.from ?? "");
      search.set(toKey, next.to ?? "");
      const isDefault = matchPreset(next) === defaultPreset;
      if (isDefault) {
        search.delete(fromKey);
        search.delete(toKey);
      }
      const qs = search.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [query, fromKey, toKey, defaultPreset, router, pathname],
  );

  return { range, setRange };
}

/** Analytics take a bounded range (at most 3 years), so no "All time". */
export const ANALYTICS_PRESETS: DatePreset[] = [
  "today",
  "7d",
  "30d",
  "90d",
  "this-month",
  "last-month",
  "ytd",
];

/**
 * The overview and analytics range: `from`/`to` in the URL, the last 30
 * days by default. An empty range (all time, from an old link) falls back to
 * the default, since the analytics API has no all-time view.
 */
export function useAnalyticsRange() {
  const { range, setRange } = useUrlDateRange({ defaultPreset: "30d" });
  const bounded = range.from || range.to ? range : presetRange("30d");
  return { range: bounded, setRange };
}
