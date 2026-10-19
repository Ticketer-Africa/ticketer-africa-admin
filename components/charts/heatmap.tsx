"use client";

import { useState } from "react";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HeatmapCell } from "@/services/v2/analytics";

/*
 * Tickets sold by Lagos weekday (rows, Monday first) and hour (columns).
 * One hue, light to dark: five steps of the key series colour over the
 * surface, so dark mode gets its own steps (dim to bright) from the same
 * token. Zero is a hollow outlined cell, not the lightest step. On phones the grid
 * keeps its cell size and scrolls inside its own frame.
 */

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// Alpha of --chart-1 over the surface. Measured (sRGB compositing): the first
// step is 1.5:1 against the surface in both themes and each step is ≥ 1.3:1
// against the next, so neighbours stay apart. Zero is a hollow cell instead.
const STEPS = [0.3, 0.48, 0.64, 0.82, 1];
const HOLLOW = "shadow-[inset_0_0_0_1px_oklch(var(--input))]";

const pad = (n: number) => String(n).padStart(2, "0");
export const hourRange = (hour: number) => `${pad(hour)}:00–${pad((hour + 1) % 24)}:00`;

function step(value: number, max: number): number {
  if (value <= 0 || max <= 0) return -1;
  return Math.min(STEPS.length - 1, Math.ceil((value / max) * STEPS.length) - 1);
}

function fill(level: number): string {
  return level < 0 ? "transparent" : `oklch(var(--chart-1) / ${STEPS[level]})`;
}

const describe = (cell: HeatmapCell) =>
  `${WEEKDAYS[cell.weekday]}, ${hourRange(cell.hour)}: ${formatCount(cell.ticketsSold)} ${
    cell.ticketsSold === 1 ? "ticket" : "tickets"
  }`;

export function Heatmap({ cells }: { cells: HeatmapCell[] }) {
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);
  const max = Math.max(0, ...cells.map((c) => c.ticketsSold));
  const busiest = cells.reduce<HeatmapCell | null>(
    (best, c) => (c.ticketsSold > (best?.ticketsSold ?? 0) ? c : best),
    null,
  );
  const grid = WEEKDAYS.map((_, weekday) =>
    Array.from({ length: 24 }, (_, hour) => cells.find((c) => c.weekday === weekday && c.hour === hour)),
  );

  return (
    <div className="grid gap-3">
      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {hovered ? (
          <span className="text-foreground">{describe(hovered)}</span>
        ) : busiest ? (
          <>
            Busiest: <span className="text-foreground">{describe(busiest)}</span>
          </>
        ) : null}
      </p>
      <div className="overflow-x-auto pb-1">
        <div
          role="img"
          aria-label={`Tickets sold by weekday and hour, Lagos time.${busiest ? ` Busiest: ${describe(busiest)}.` : ""} Switch to Table for every value.`}
          className="grid min-w-[30rem] grid-cols-[2.5rem_repeat(24,minmax(0.875rem,1fr))] gap-[2px]"
          onPointerLeave={() => setHovered(null)}
        >
          {grid.map((row, weekday) => (
            <div key={weekday} className="contents">
              <span className="sticky left-0 z-[1] bg-surface pr-2 text-xs leading-[1.375rem] text-muted-foreground">
                {WEEKDAYS[weekday].slice(0, 3)}
              </span>
              {row.map((cell, hour) => {
                const value = cell?.ticketsSold ?? 0;
                const level = step(value, max);
                const active = hovered?.weekday === weekday && hovered?.hour === hour;
                return (
                  <span
                    key={hour}
                    title={cell ? describe(cell) : undefined}
                    onPointerEnter={() => cell && setHovered(cell)}
                    className={cn(
                      "h-[1.375rem] rounded-[3px] transition-shadow duration-state",
                      level < 0 && HOLLOW,
                      active && "shadow-[0_0_0_2px_oklch(var(--foreground))]",
                    )}
                    style={{ backgroundColor: fill(level) }}
                  />
                );
              })}
            </div>
          ))}
          <span className="sticky left-0 z-[1] bg-surface" />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className="num pt-1 text-center text-[11px] text-muted-foreground">
              {hour % 3 === 0 ? pad(hour) : ""}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn("size-2.5 rounded-[2px]", HOLLOW)} />
          None
        </span>
        <span className="flex items-center gap-1.5">
          Fewer
          <span aria-hidden="true" className="flex gap-[2px]">
            {STEPS.map((_, level) => (
              <span key={level} className="size-2.5 rounded-[2px]" style={{ backgroundColor: fill(level) }} />
            ))}
          </span>
          More
        </span>
        {max > 0 && <span className="num">Top step: up to {formatCount(max)} tickets an hour</span>}
      </div>
    </div>
  );
}
