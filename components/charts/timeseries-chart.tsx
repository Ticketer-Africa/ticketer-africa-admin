"use client";

import type { ReactNode } from "react";
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, Text, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatCompact, formatCompactNaira, formatCount, formatNaira } from "@/lib/format";
import type { Granularity, PartialKind } from "@/services/v2/analytics";
import { cn } from "@/lib/utils";
import { seriesColor } from "./chart-panel";

/*
 * Change over time on one axis. Every series shares a unit (all naira or all
 * counts); two units, or two very different scales, means two charts, never a
 * second y-axis. Areas are a 10% wash under a 2px line, bars are at most 24px
 * with a 4px rounded top. Buckets that don't hold a whole period (today so
 * far, a week the range cuts) are drawn dashed (lines, areas) or faded (bars)
 * so a half-finished period doesn't read as a drop.
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

export type Partials = Record<string, PartialKind>;

/** "Mon 19 Oct 2026 (so far)" for tooltips and table rows. */
export function periodLabel(bucket: string, granularity: Granularity, partials?: Partials): string {
  const kind = partials?.[bucket];
  return `${bucketLabel(bucket, granularity, true)}${kind ? ` (${kind})` : ""}`;
}

const RUNNING: Record<Granularity, string> = { day: "Today", week: "This week", month: "This month" };

/** One sentence for the panel description when some buckets are partial. */
export function partialNote(partials: Partials, granularity: Granularity): string | null {
  const kinds = new Set(Object.values(partials));
  if (kinds.size === 0) return null;
  if (kinds.has("so far") && kinds.has("partial")) {
    return "Dashed or faded: periods still running or cut off by the range.";
  }
  if (kinds.has("so far")) return `Dashed or faded: ${RUNNING[granularity].toLowerCase()} so far.`;
  return `Dashed or faded: ${granularity}s the range only partly covers.`;
}

const solidKey = (key: string) => `solid:${key}`;
const dashKey = (key: string) => `dash:${key}`;

/**
 * Splits each line/area series into a solid run over whole periods and a
 * dashed run over partial ones (plus their neighbour, so the two join).
 */
function splitPartials<K extends string>(
  data: ({ bucket: string } & Record<K, number>)[],
  keys: K[],
  partials: Partials,
) {
  const isPartial = (i: number) => i >= 0 && i < data.length && Boolean(partials[data[i].bucket]);
  return data.map((point, i) => {
    const out: Record<string, unknown> = { ...point };
    const partial = isPartial(i);
    const touchesPartial = partial || isPartial(i - 1) || isPartial(i + 1);
    for (const key of keys) {
      out[solidKey(key)] = partial ? null : point[key];
      out[dashKey(key)] = touchesPartial ? point[key] : null;
    }
    return out;
  });
}

interface AxisTickProps {
  x?: number;
  y?: number;
  index?: number;
  visibleTicksCount?: number;
  payload?: { value: string };
  [prop: string]: unknown;
}

interface TimeseriesChartProps<K extends string> {
  data: ({ bucket: string } & Record<K, number>)[];
  series: TimeSeries<K>[];
  granularity: Granularity;
  format: ValueFormat;
  /** Buckets that don't hold a whole period (from `partialBuckets`). */
  partials?: Partials;
  /** Total height including the x-axis band (the minimum when `fill`). */
  height?: number;
  /** Grow to fill the panel's leftover height (bento rows of unequal panels). */
  fill?: boolean;
  /** Hide the date axis (the upper chart of a stacked pair shares the lower one's). */
  showXAxis?: boolean;
  /** Charts with the same id move their hover together. */
  syncId?: string;
}

export function TimeseriesChart<K extends string>({
  data,
  series,
  granularity,
  format,
  partials = {},
  height = 240,
  fill = false,
  showXAxis = true,
  syncId,
}: TimeseriesChartProps<K>) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: seriesColor(s.color) }]),
  ) satisfies ChartConfig;
  const hasBars = series.some((s) => s.kind === "bar");
  const rows = splitPartials(
    data,
    series.filter((s) => s.kind !== "bar").map((s) => s.key),
    partials,
  );
  const activeDot = { r: 4, stroke: "oklch(var(--surface))", strokeWidth: 2 };

  // First and last labels anchor inward so they never run off the plot.
  const renderTick = ({ payload, index = 0, visibleTicksCount = 0, ...props }: AxisTickProps) => {
    const anchor = index === 0 ? "start" : index === visibleTicksCount - 1 ? "end" : "middle";
    return (
      <Text {...props} textAnchor={anchor} className="num fill-muted-foreground">
        {payload ? bucketLabel(payload.value, granularity) : ""}
      </Text>
    );
  };

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto w-full", fill && "flex-1")}
      style={fill ? { minHeight: height } : { height }}
    >
      <ComposedChart
        data={rows}
        syncId={syncId}
        margin={{ top: 8, right: 8, bottom: showXAxis ? 0 : 8, left: 0 }}
        accessibilityLayer
      >
        <CartesianGrid vertical={false} stroke="oklch(var(--border))" />
        <XAxis
          dataKey="bucket"
          hide={!showXAxis}
          tickLine={false}
          axisLine={{ stroke: "oklch(var(--border))" }}
          tickMargin={8}
          minTickGap={24}
          interval="preserveStartEnd"
          tick={renderTick}
        />
        <YAxis
          width={format === "naira" ? 56 : 40}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          interval={0}
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
                title={periodLabel(String(label), granularity, partials)}
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
        {series.flatMap((s) => {
          const color = `var(--color-${s.key})`;
          if (s.kind === "bar") {
            return [
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={color}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                {rows.map((row) => (
                  <Cell key={String(row.bucket)} fillOpacity={partials[String(row.bucket)] ? 0.4 : 1} />
                ))}
              </Bar>,
            ];
          }
          const shared = {
            type: "monotone" as const,
            name: s.label,
            stroke: color,
            strokeWidth: 2,
            activeDot,
            isAnimationActive: false,
            legendType: "none" as const,
          };
          if (s.kind === "area") {
            return [
              <Area key={solidKey(s.key)} dataKey={solidKey(s.key)} fill={color} fillOpacity={0.1} {...shared} />,
              <Area
                key={dashKey(s.key)}
                dataKey={dashKey(s.key)}
                fill={color}
                fillOpacity={0.04}
                strokeDasharray="4 4"
                {...shared}
              />,
            ];
          }
          return [
            <Line key={solidKey(s.key)} dataKey={solidKey(s.key)} dot={false} {...shared} />,
            <Line key={dashKey(s.key)} dataKey={dashKey(s.key)} dot={false} strokeDasharray="4 4" {...shared} />,
          ];
        })}
      </ComposedChart>
    </ChartContainer>
  );
}
