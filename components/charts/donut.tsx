"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatPercent } from "@/lib/format";
import { seriesColor } from "./chart-panel";
import { TooltipCard } from "./timeseries-chart";

/*
 * Part-to-whole for a few parts (at most ~5). Segments are separated by a
 * 2px gap in the surface colour; the total sits in the hole, and every part
 * is labelled beside the ring with its value and share, so the legend is
 * also the direct label.
 */

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  /** Token name, in the documented categorical order. */
  color: string;
}

interface DonutProps {
  segments: DonutSegment[];
  /** How a value reads ("₦1,200.00"). */
  format: (value: number) => string;
  /** Caption under the total in the hole, e.g. "in fees". */
  totalLabel: string;
  total?: number;
}

export function Donut({ segments, format, totalLabel, total }: DonutProps) {
  const sum = total ?? segments.reduce((acc, s) => acc + s.value, 0);
  const config = Object.fromEntries(
    segments.map((s) => [s.key, { label: s.label, color: seriesColor(s.color) }]),
  ) satisfies ChartConfig;
  const drawn = segments.filter((s) => s.value > 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-44 shrink-0">
        <ChartContainer config={config} className="aspect-square size-44">
          <PieChart accessibilityLayer>
            <Tooltip
              isAnimationActive={false}
              content={({ active, payload }) => {
                const item = payload?.[0]?.payload as DonutSegment | undefined;
                return active && item ? (
                  <TooltipCard
                    rows={[{ label: item.label, color: item.color, shape: "block", value: format(item.value) }]}
                  />
                ) : null;
              }}
            />
            <Pie
              data={drawn}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="oklch(var(--surface))"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {drawn.map((s) => (
                <Cell key={s.key} fill={`var(--color-${s.key})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="num max-w-[7.5rem] truncate text-sm font-semibold text-foreground" title={format(sum)}>
            {format(sum)}
          </span>
          <span className="text-xs text-muted-foreground">{totalLabel}</span>
        </div>
      </div>
      <ul className="grid w-full min-w-0 gap-2 text-sm">
        {segments.map((s) => (
          <li key={s.key} className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 translate-y-[-1px] rounded-[2px]"
                style={{ backgroundColor: seriesColor(s.color) }}
              />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2">
              <span className="num text-xs text-muted-foreground">
                {sum > 0 ? formatPercent(s.value / sum, 0) : "—"}
              </span>
              <span className="num font-medium text-foreground">{format(s.value)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
