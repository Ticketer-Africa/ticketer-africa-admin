/*
 * Date ranges as Lagos calendar days ("YYYY-MM-DD", both ends inclusive),
 * the format every /v2/admin endpoint takes. An empty object means all time.
 */

export interface DateRange {
  from?: string;
  to?: string;
}

export const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "ytd", label: "Year to date" },
  { id: "all", label: "All time" },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]["id"];

/** Lagos is UTC+1 all year (no DST). */
const LAGOS_OFFSET_MS = 3_600_000;
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** The Lagos calendar day containing `now`, as YYYY-MM-DD. */
export function lagosToday(now: Date = new Date()): string {
  return ymd(new Date(now.getTime() + LAGOS_OFFSET_MS));
}

/** UTC midnight of a YYYY-MM-DD day, used only for calendar arithmetic. */
function day(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function daysBack(today: string, days: number): DateRange {
  return { from: ymd(new Date(day(today).getTime() - (days - 1) * DAY_MS)), to: today };
}

export function presetRange(preset: DatePreset, now: Date = new Date()): DateRange {
  const today = lagosToday(now);
  const t = day(today);
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return daysBack(today, 7);
    case "30d":
      return daysBack(today, 30);
    case "90d":
      return daysBack(today, 90);
    case "this-month":
      return { from: ymd(new Date(Date.UTC(y, m, 1))), to: today };
    case "last-month":
      return {
        from: ymd(new Date(Date.UTC(y, m - 1, 1))),
        // Day 0 of this month is the last day of the previous one.
        to: ymd(new Date(Date.UTC(y, m, 0))),
      };
    case "ytd":
      return { from: ymd(new Date(Date.UTC(y, 0, 1))), to: today };
    case "all":
      return {};
  }
}

/** Which preset a range equals today, or "custom". */
export function matchPreset(
  range: DateRange,
  now: Date = new Date(),
): DatePreset | "custom" {
  for (const { id } of DATE_PRESETS) {
    const candidate = presetRange(id, now);
    if (candidate.from === range.from && candidate.to === range.to) return id;
  }
  return "custom";
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real YYYY-MM-DD calendar day. */
export function isDay(value: string | undefined): value is string {
  if (!value || !DATE_ONLY.test(value)) return false;
  return ymd(day(value)) === value;
}
