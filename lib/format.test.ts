import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatDate,
  formatDateTime,
  formatDelta,
  formatNaira,
  formatPercent,
  formatRelative,
} from "@/lib/format";

describe("formatNaira", () => {
  it("formats 1234.5 as ₦1,234.50", () => {
    expect(formatNaira(1234.5)).toBe("₦1,234.50");
  });

  it("formats null as —", () => {
    expect(formatNaira(null)).toBe("—");
    expect(formatNaira(undefined)).toBe("—");
    expect(formatNaira(Number.NaN)).toBe("—");
  });

  it("puts the minus sign before the naira sign", () => {
    expect(formatNaira(-300)).toBe("-₦300.00");
  });

  it("formats zero and large amounts", () => {
    expect(formatNaira(0)).toBe("₦0.00");
    expect(formatNaira(12_345_678.9)).toBe("₦12,345,678.90");
  });
});

describe("formatCount", () => {
  it("groups thousands and shows — for missing values", () => {
    expect(formatCount(1234567)).toBe("1,234,567");
    expect(formatCount(0)).toBe("0");
    expect(formatCount(null)).toBe("—");
  });
});

describe("dates (Africa/Lagos)", () => {
  // 23:30 UTC is 00:30 the next day in Lagos (UTC+1).
  const late = "2026-10-18T23:30:00.000Z";

  it("formats a date in Lagos time", () => {
    expect(formatDate(late)).toBe("19 Oct 2026");
  });

  it("formats a date and time in Lagos time", () => {
    expect(formatDateTime(late)).toBe("19 Oct 2026, 00:30");
  });

  it("uses three-letter months (Sep, not Sept)", () => {
    expect(formatDate("2026-09-11T10:00:00.000Z")).toBe("11 Sep 2026");
  });

  it("shows — for missing or invalid dates", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDateTime("not a date")).toBe("—");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-10-19T12:00:00.000Z");

  it("says just now for the last minute", () => {
    expect(formatRelative("2026-10-19T11:59:30.000Z", now)).toBe("just now");
  });

  it("counts minutes, hours and days", () => {
    expect(formatRelative("2026-10-19T11:55:00.000Z", now)).toBe("5 min ago");
    expect(formatRelative("2026-10-19T09:00:00.000Z", now)).toBe("3 h ago");
    expect(formatRelative("2026-10-17T12:00:00.000Z", now)).toBe("2 days ago");
  });

  it("falls back to the date after a week", () => {
    expect(formatRelative("2026-10-01T12:00:00.000Z", now)).toBe("1 Oct 2026");
  });
});

describe("formatPercent", () => {
  it("formats a ratio as a percentage", () => {
    expect(formatPercent(0.9534)).toBe("95.3%");
    expect(formatPercent(1)).toBe("100.0%");
    expect(formatPercent(null)).toBe("—");
  });
});

describe("formatDelta", () => {
  it("delta up/down/flat with percentage, previous 0 → 'new'", () => {
    expect(formatDelta(125, 100)).toEqual({ label: "+25.0%", direction: "up" });
    expect(formatDelta(80, 100)).toEqual({ label: "−20.0%", direction: "down" });
    expect(formatDelta(100, 100)).toEqual({ label: "0.0%", direction: "flat" });
    expect(formatDelta(50, 0)).toEqual({ label: "new", direction: "up" });
  });

  it("treats a tiny change as flat and nothing-to-nothing as flat", () => {
    expect(formatDelta(100.01, 100)).toEqual({ label: "0.0%", direction: "flat" });
    expect(formatDelta(0, 0)).toEqual({ label: "0.0%", direction: "flat" });
  });

  it("measures change against the size of a negative previous value", () => {
    expect(formatDelta(-50, -100)).toEqual({ label: "+50.0%", direction: "up" });
  });

  it("shows — when either side is missing", () => {
    expect(formatDelta(null, 100)).toEqual({ label: "—", direction: "flat" });
    expect(formatDelta(100, undefined)).toEqual({ label: "—", direction: "flat" });
  });
});
