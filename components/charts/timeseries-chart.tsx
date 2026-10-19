"use client";

import type { ReactNode } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatCompact, formatCompactNaira, formatCount, formatNaira } from "@/lib/format";
import type { Granularity } from "@/services/v2/analytics";
import { cn } from "@/lib/utils";
import { seriesColor } from "./chart-panel";

/*
 * Change over time on one axis. Every series shares a unit (all naira or all
 * counts); two units means two charts, never a second y-axis. Areas are a
 * 10% wash under a 2px line, bars are at most 24px with a 4px rounded top.
 */

export interface TimeSeries<K extends string> {
  key: K;
  label: string;
  /** Token name, e.g. "chart-1". */
  color: string;
  kind: "area" | "line" | "bar";
}

export type ValueFormat = "naira" | "count";

const UTC_DAY = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const UTC_MONTH = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" });

function parts(bucket: string) {
  const found = UTC_DAY.formatToParts(new Date(`${bucket}T00:00:00Z`));
  const part = (type: Intl.DateTimeFormatPartTypes) => found.find((p) => p.type === type)?.value ?? "";
  return { weekday: part("weekday"), day: part("day"), month: part("month"), year: part("year") };
}

/**
 * A bucket (its first Lagos day, YYYY-MM-DD) for an axis tick ("19 Oct",
 * "Oct 2026") or, with `long`, for a tooltip or table ("Mon 19 Oct 2026",
 * "Week of 13 Oct 2026", "October 2026").
 */
export function bucketLabel(bucket: string, granularity: Granularity, long = false): string {
  const { weekday, day, month, year } = parts(bucket);
  if (granularity === "month") {
    return long ? UTC_MONTH.format(new Date(`${bucket}T00:00:00Z`)) : `${month} ${year}`;
  }
  if (!long) return `${day} ${month}`;
  if (granularity === "week") return `Week of ${day} ${month} ${year}`;
  return `${weekday} ${day} ${month} ${year}`;
}

export const formatValue = (value: number, format: ValueFormat) =>
  format === "naira" ? formatNaira(value) : formatCount(value);

interface TooltipRow {
  label: string;
  color: string;
  value: string;
  shape?: "line" | "block";
}

/** The hover readout: the value leads, the series name follows. */
export function TooltipCard({ title, rows }: { title?: ReactNode; rows: TooltipRow[] }) {
  return (
    <div className="min-w-40 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-overlay">
      {title && <p className="mb-1.5 text-muted-foreground">{title}</p>}
      <ul className="grid gap-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                aria-hidden="true"
                className={row.shape === "block" ? "size-2.5 rounded-[2px]" : "h-0.5 w-3 rounded-full"}
                style={{ backgroundColor: seriesColor(row.color) }}
              />
              {row.label}
            </span>
            <span className="num font-semibold text-foreground">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface TimeseriesChartProps<K extends string> {
  data: ({ bucket: string } & Record<K, number>)[];
  series: TimeSeries<K>[];
  granularity: Granularity;
  format: ValueFormat;
  /** Total height including the x-axis band (the minimum when `fill`). */
  height?: number;
  /** Grow to fill the panel's leftover height (bento rows of unequal panels). */
  fill?: boolean;
}

export function TimeseriesChart<K extends string>({
  data,
  series,
  granularity,
  format,
  height = 240,
  fill = false,
}: TimeseriesChartProps<K>) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: seriesColor(s.color) }]),
  ) satisfies ChartConfig;
  const hasBars = series.some((s) => s.kind === "bar");

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto w-full", fill && "flex-1")}
      style={fill ? { minHeight: height } : { height }}
    >
      <ComposedChart data={data} margin={{ top: 8, right: 24, bottom: 0, left: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="oklch(var(--border))" />
        <XAxis
          dataKey="bucket"
          tickLine={false}
          axisLine={{ stroke: "oklch(var(--border))" }}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(bucket: string) => bucketLabel(bucket, granularity)}
          className="num"
        />
        <YAxis
          width={format === "naira" ? 56 : 40}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          allowDecimals={false}
          tickFormatter={(value: number) => (format === "naira" ? formatCompactNaira(value) : formatCompact(value))}
          className="num"
        />
        <Tooltip
          cursor={
            hasBars
              ? { fill: "oklch(var(--muted))" }
              : { stroke: "oklch(var(--muted-foreground))", strokeWidth: 1 }
          }
          isAnimationActive={false}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipCard
                title={bucketLabel(String(label), granularity, true)}
                rows={series.map((s) => ({
                  label: s.label,
                  color: s.color,
                  shape: s.kind === "line" ? "line" : "block",
                  value: formatValue(Number(payload[0].payload[s.key] ?? 0), format),
                }))}
              />
            ) : null
          }
        />
        {series.map((s) => {
          const color = `var(--color-${s.key})`;
          if (s.kind === "bar") {
            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={color}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            );
          }
          if (s.kind === "area") {
            return (
              <Area
                key={s.key}
                dataKey={s.key}
                name={s.label}
                type="monotone"
                stroke={color}
                strokeWidth={2}
                fill={color}
                fillOpacity={0.1}
                activeDot={{ r: 4, stroke: "oklch(var(--surface))", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            );
          }
          return (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type="monotone"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "oklch(var(--surface))", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          );
        })}
      </ComposedChart>
    </ChartContainer>
  );
}
