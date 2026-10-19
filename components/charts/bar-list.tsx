import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { seriesColor } from "./chart-panel";

/*
 * Ranked magnitudes as thin horizontal bars under each row's name, values
 * at the end of the row. One series, one colour: bar length carries the
 * value, so the colour never re-encodes it. Values are always printed, so
 * nothing hides behind a hover.
 */

export interface BarListRow {
  key: string;
  /** The row's name; may be a link. */
  label: ReactNode;
  value: number;
  /** The value as people read it ("₦12,500.00"). */
  display: string;
  /** Secondary facts under the value ("42 tickets"). */
  detail?: ReactNode;
}

interface BarListProps {
  rows: BarListRow[];
  /** Token name; defaults to the key series colour. */
  color?: string;
  /** Flow long lists into two newspaper columns from 1024px (rank reads down, then across). */
  columns?: boolean;
  className?: string;
}

export function BarList({ rows, color = "chart-1", columns = false, className }: BarListProps) {
  const max = Math.max(0, ...rows.map((row) => row.value));
  return (
    <ol className={cn("grid gap-3", columns && "lg:block lg:columns-2 lg:gap-x-10 lg:[&>li]:mb-3 lg:[&>li]:break-inside-avoid", className)}>
      {rows.map((row) => {
        const share = max > 0 ? Math.max(0, row.value) / max : 0;
        return (
          <li key={row.key} className="grid gap-1.5">
            <div className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">{row.label}</span>
              <span className="flex shrink-0 items-baseline gap-2">
                {row.detail && <span className="num text-xs text-muted-foreground">{row.detail}</span>}
                <span className="num font-medium text-foreground">{row.display}</span>
              </span>
            </div>
            <div aria-hidden="true" className="h-1.5 w-full">
              <div
                className="h-full rounded-r-[4px]"
                style={{
                  width: share > 0 ? `max(${(share * 100).toFixed(2)}%, 4px)` : 0,
                  backgroundColor: seriesColor(color),
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
