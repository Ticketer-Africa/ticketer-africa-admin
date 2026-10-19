import { describe, expect, it } from "vitest";
import { lagosToday, matchPreset, presetRange } from "@/lib/date-range";

// 23:30 UTC on the 18th is already the 19th in Lagos (UTC+1).
const now = new Date("2026-10-18T23:30:00.000Z");

describe("lagosToday", () => {
  it("returns the Lagos calendar day", () => {
    expect(lagosToday(now)).toBe("2026-10-19");
  });
});

describe("presetRange", () => {
  it("counts rolling ranges back from today, including today", () => {
    expect(presetRange("today", now)).toEqual({ from: "2026-10-19", to: "2026-10-19" });
    expect(presetRange("7d", now)).toEqual({ from: "2026-10-13", to: "2026-10-19" });
    expect(presetRange("30d", now)).toEqual({ from: "2026-09-20", to: "2026-10-19" });
    expect(presetRange("90d", now)).toEqual({ from: "2026-07-22", to: "2026-10-19" });
  });

  it("handles calendar ranges", () => {
    expect(presetRange("this-month", now)).toEqual({ from: "2026-10-01", to: "2026-10-19" });
    expect(presetRange("last-month", now)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(presetRange("ytd", now)).toEqual({ from: "2026-01-01", to: "2026-10-19" });
  });

  it("finds last month across a year boundary and in short months", () => {
    expect(presetRange("last-month", new Date("2027-01-10T10:00:00Z"))).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
    expect(presetRange("last-month", new Date("2028-03-05T10:00:00Z"))).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });

  it("all time has no bounds", () => {
    expect(presetRange("all", now)).toEqual({});
  });
});

describe("matchPreset", () => {
  it("names a range that matches a preset today", () => {
    expect(matchPreset({ from: "2026-09-20", to: "2026-10-19" }, now)).toBe("30d");
    expect(matchPreset({}, now)).toBe("all");
  });

  it("calls anything else custom", () => {
    expect(matchPreset({ from: "2026-09-21", to: "2026-10-19" }, now)).toBe("custom");
    expect(matchPreset({ from: "2026-09-21" }, now)).toBe("custom");
  });
});
