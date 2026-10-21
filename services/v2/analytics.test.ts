import { describe, expect, it } from "vitest";
import { autoGranularity, partialBuckets, rangeDays } from "./analytics";

const now = new Date("2026-10-19T12:00:00Z");

describe("rangeDays", () => {
  it("counts both ends of the range", () => {
    expect(rangeDays({ from: "2026-10-19", to: "2026-10-19" }, now)).toBe(1);
    expect(rangeDays({ from: "2026-09-20", to: "2026-10-19" }, now)).toBe(30);
  });

  it("reads a missing end as today and a missing start as the API's 30 days", () => {
    expect(rangeDays({ from: "2026-10-10" }, now)).toBe(10);
    expect(rangeDays({ to: "2026-10-19" }, now)).toBe(30);
  });
});

describe("autoGranularity", () => {
  it("uses days up to 45 days, weeks up to 200, then months", () => {
    expect(autoGranularity({ from: "2026-09-05", to: "2026-10-19" }, now)).toBe("day"); // 45
    expect(autoGranularity({ from: "2026-09-04", to: "2026-10-19" }, now)).toBe("week"); // 46
    expect(autoGranularity({ from: "2026-04-03", to: "2026-10-19" }, now)).toBe("week"); // 200
    expect(autoGranularity({ from: "2026-04-02", to: "2026-10-19" }, now)).toBe("month"); // 201
  });
});

describe("partialBuckets", () => {
  const today = new Date("2026-10-19T12:00:00Z"); // a Monday in Lagos

  it("marks today's day bucket as in progress and leaves finished days alone", () => {
    const range = { from: "2026-10-17", to: "2026-10-19" };
    const result = partialBuckets(["2026-10-17", "2026-10-18", "2026-10-19"], range, "day", today);
    expect(result).toEqual({ "2026-10-19": "so far" });
  });

  it("marks nothing when the range ended before today", () => {
    const range = { from: "2026-10-01", to: "2026-10-10" };
    expect(partialBuckets(["2026-10-01", "2026-10-10"], range, "day", today)).toEqual({});
  });

  it("marks a first week that starts before the range and the week still running", () => {
    // 2026-09-30 is a Wednesday; its week starts Monday 28 Sep.
    const range = { from: "2026-09-30", to: "2026-10-19" };
    const buckets = ["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19"];
    expect(partialBuckets(buckets, range, "week", today)).toEqual({
      "2026-09-28": "partial",
      "2026-10-19": "so far",
    });
  });

  it("marks a last month the range cuts short as partial, not so far", () => {
    const range = { from: "2026-07-01", to: "2026-08-15" };
    expect(partialBuckets(["2026-07-01", "2026-08-01"], range, "month", today)).toEqual({
      "2026-08-01": "partial",
    });
  });
});
