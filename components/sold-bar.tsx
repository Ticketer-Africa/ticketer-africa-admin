import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SoldBarProps {
  sold: number;
  capacity: number;
  className?: string;
}

/** "120 / 300" with a thin fill bar; full reads as warning, never as an error. */
export function SoldBar({ sold, capacity, className }: SoldBarProps) {
  const pct = capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
  return (
    <div className={cn("min-w-[7rem] space-y-1", className)}>
      <span className="num block whitespace-nowrap text-xs text-foreground">
        {formatCount(sold)}
        <span className="text-muted-foreground"> / {capacity > 0 ? formatCount(capacity) : "—"}</span>
      </span>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={capacity > 0 ? `${pct}% sold` : "No capacity set"}
      >
        <div
          className={cn("h-full rounded-full", pct >= 100 ? "bg-warning" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
