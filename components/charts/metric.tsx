import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDownRight01Icon, ArrowUpRight01Icon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDelta, formatDeltaPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * A figure for the range with its change from the previous period. The
 * change carries an arrow and a sign as well as colour: green when it moved
 * the good way, crimson when it moved the bad way, muted when flat.
 */

interface MetricProps {
  label: string;
  /** Already formatted ("₦1,234.56", "1,204", "96.2%"). */
  value: string;
  current?: number | null;
  previous?: number | null;
  /** "vs previous 30 days". */
  compareLabel?: string;
  /** Set when a rise is bad news (refunds). */
  downIsGood?: boolean;
  /** What the previous value was, shown on hover of the change. */
  previousDisplay?: string;
  size?: "lg" | "md" | "sm";
  /** "points" for rates: "+0.3 pp" instead of a relative "+0.3%". */
  deltaKind?: "percent" | "points";
  loading?: boolean;
  className?: string;
}

export function Metric({
  label,
  value,
  current,
  previous,
  compareLabel,
  downIsGood = false,
  previousDisplay,
  size = "md",
  deltaKind = "percent",
  loading = false,
  className,
}: MetricProps) {
  const hasDelta = current !== undefined && previous !== undefined;
  const delta = hasDelta
    ? (deltaKind === "points" ? formatDeltaPoints : formatDelta)(current, previous)
    : null;
  const good = delta && delta.direction !== "flat" && (delta.direction === "up") !== downIsGood;
  const bad = delta && delta.direction !== "flat" && !good;
  const icon =
    delta?.direction === "up" ? ArrowUpRight01Icon : delta?.direction === "down" ? ArrowDownRight01Icon : MinusSignIcon;
  const spoken =
    delta?.label === "new"
      ? "New this period"
      : delta && delta.direction !== "flat"
      ? `${delta.direction === "up" ? "Up" : "Down"} ${delta.label.replace(/^[+−]/, "").replace(" pp", " percentage points")}`
      : delta?.direction === "flat" && delta.label !== "—"
        ? "No change"
        : delta?.label;

  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className={cn("mt-1.5", size === "lg" ? "h-7 w-36" : size === "md" ? "h-6 w-24" : "h-5 w-20")} />
      ) : (
        <p
          className={cn(
            "num mt-1 truncate font-semibold tracking-[-0.01em] text-foreground",
            size === "lg" ? "text-2xl" : size === "md" ? "text-lg md:text-xl" : "text-base",
          )}
          title={value}
        >
          {value}
        </p>
      )}
      {delta && !loading && (
        <p
          className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground"
          title={previousDisplay ? `Previous period: ${previousDisplay}` : undefined}
        >
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              good && "text-success",
              bad && "text-destructive",
            )}
          >
            <HugeiconsIcon icon={icon} aria-hidden="true" className="size-3.5" />
            <span className="sr-only">{spoken}</span>
            <span aria-hidden="true" className="num">
              {delta.label}
            </span>
          </span>
          {compareLabel && <span>{compareLabel}</span>}
        </p>
      )}
    </div>
  );
}
