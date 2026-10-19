import { describe, expect, it } from "vitest";
import { autoGranularity, rangeDays } from "./analytics";

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
