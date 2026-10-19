/*
 * Every figure a person reads goes through here. Money arrives from the API
 * as naira numbers and leaves as "₦1,234.56". Dates are shown in Lagos time
 * whatever the viewer's device says, so two founders see the same day.
 */

export const EMPTY = "—";
export const TIME_ZONE = "Africa/Lagos";

const nairaNumber = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const countNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
// en-US parts ("Sep", not en-GB's "Sept"), assembled day-first.
const dateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateFormat = {
  format(date: Date): string {
    const parts = dateParts.formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    return `${part("day")} ${part("month")} ${part("year")}`;
  },
};
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const isNumber = (n: number | null | undefined): n is number =>
  typeof n === "number" && Number.isFinite(n);

/** Naira amount → "₦1,234.56"; negative → "-₦300.00"; missing → "—". */
export function formatNaira(n: number | null | undefined): string {
  if (!isNumber(n)) return EMPTY;
  const formatted = nairaNumber.format(Math.abs(n));
  return `${n < 0 && formatted !== "0.00" ? "-" : ""}₦${formatted}`;
}

/** 1234567 → "1,234,567". */
export function formatCount(n: number | null | undefined): string {
  return isNumber(n) ? countNumber.format(n) : EMPTY;
}

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "19 Oct 2026" in Lagos time. */
export function formatDate(value: DateInput): string {
  const date = toDate(value);
  return date ? dateFormat.format(date) : EMPTY;
}

/** "19 Oct 2026, 14:05" in Lagos time. */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  return date ? `${dateFormat.format(date)}, ${timeFormat.format(date)}` : EMPTY;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "5 min ago", "3 h ago", "2 days ago", then the date. */
export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  const diff = now.getTime() - date.getTime();
  if (diff < 0) return formatDateTime(date);
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  const days = Math.floor(diff / DAY);
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  return formatDate(date);
}

/** A ratio (0.953) → "95.3%". */
export function formatPercent(
  ratio: number | null | undefined,
  digits = 1,
): string {
  return isNumber(ratio) ? `${(ratio * 100).toFixed(digits)}%` : EMPTY;
}

export type DeltaDirection = "up" | "down" | "flat";

/**
 * Change from the previous period as a signed percentage. Anything that
 * rounds to 0.0% is flat. Growth from nothing is "new".
 */
export function formatDelta(
  current: number | null | undefined,
  previous: number | null | undefined,
): { label: string; direction: DeltaDirection } {
  if (!isNumber(current) || !isNumber(previous)) {
    return { label: EMPTY, direction: "flat" };
  }
  if (previous === 0) {
    if (current === 0) return { label: "0.0%", direction: "flat" };
    return { label: "new", direction: current > 0 ? "up" : "down" };
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.abs(change).toFixed(1);
  if (rounded === "0.0") return { label: "0.0%", direction: "flat" };
  return change > 0
    ? { label: `+${rounded}%`, direction: "up" }
    : { label: `−${rounded}%`, direction: "down" };
}
