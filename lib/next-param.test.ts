import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next-param";

describe("safeNextPath", () => {
  it("only allows same-origin relative paths", () => {
    expect(safeNextPath("/events?x=1")).toBe("/events?x=1");
    expect(safeNextPath("/transactions/abc#activity")).toBe(
      "/transactions/abc#activity",
    );
    expect(safeNextPath("/")).toBe("/");

    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });

  it("rejects tricks that browsers normalise into another origin", () => {
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("\\\\evil.com")).toBe("/");
    expect(safeNextPath("/\t/evil.com")).toBe("/");
    expect(safeNextPath(" /events")).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath("events")).toBe("/");
  });

  it("does not send people back to the login page", () => {
    expect(safeNextPath("/login")).toBe("/");
    expect(safeNextPath("/login?next=/events")).toBe("/");
  });
});
