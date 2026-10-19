import { describe, expect, it } from "vitest";
import {
  defineListDefaults,
  listParamsFromSearch,
  listParamsToSearch,
  withFilter,
  withPage,
  withSort,
} from "@/lib/list-params";

const defaults = defineListDefaults({
  filters: { q: undefined, role: undefined, suspended: undefined },
  sort: "createdAt",
  order: "desc",
});

describe("list params", () => {
  it("round-trips filters, sort and page through the query string", () => {
    const params = {
      q: "ada",
      role: "ORGANIZER",
      suspended: "true",
      sort: "name",
      order: "asc" as const,
      page: 3,
      pageSize: 50,
    };
    const search = listParamsToSearch(params, defaults);
    expect(listParamsFromSearch(new URLSearchParams(search), defaults)).toEqual(
      params,
    );
  });

  it("uses the defaults for an empty query string and writes nothing back", () => {
    const params = listParamsFromSearch(new URLSearchParams(""), defaults);
    expect(params).toEqual({
      q: undefined,
      role: undefined,
      suspended: undefined,
      sort: "createdAt",
      order: "desc",
      page: 1,
      pageSize: 25,
    });
    expect(listParamsToSearch(params, defaults)).toBe("");
  });

  it("ignores junk: unknown keys, bad page numbers, bad order, oversized pages", () => {
    const params = listParamsFromSearch(
      new URLSearchParams("page=-2&order=sideways&pageSize=5000&evil=1&role="),
      defaults,
    );
    expect(params.page).toBe(1);
    expect(params.order).toBe("desc");
    expect(params.pageSize).toBe(100);
    expect(params.role).toBeUndefined();
    expect(params).not.toHaveProperty("evil");
  });

  it("changing a filter resets page to 1", () => {
    const start = listParamsFromSearch(
      new URLSearchParams("page=4&role=USER"),
      defaults,
    );
    const next = withFilter(start, { role: "ORGANIZER" });
    expect(next.role).toBe("ORGANIZER");
    expect(next.page).toBe(1);
  });

  it("clears a filter set to an empty value", () => {
    const start = listParamsFromSearch(new URLSearchParams("q=ada"), defaults);
    expect(withFilter(start, { q: "" }).q).toBeUndefined();
    expect(withFilter(start, { q: "  " }).q).toBeUndefined();
  });

  it("changing the sort resets page to 1", () => {
    const start = listParamsFromSearch(new URLSearchParams("page=4"), defaults);
    const next = withSort(start, "name", "asc");
    expect(next).toMatchObject({ sort: "name", order: "asc", page: 1 });
  });

  it("moves between pages without touching filters", () => {
    const start = listParamsFromSearch(new URLSearchParams("role=USER"), defaults);
    expect(withPage(start, 2)).toMatchObject({ role: "USER", page: 2 });
    expect(withPage(start, 0).page).toBe(1);
  });

  it("writes keys in a stable order so links compare equal", () => {
    const a = listParamsToSearch(
      { q: "x", role: "USER", suspended: undefined, sort: "name", order: "asc", page: 2, pageSize: 25 },
      defaults,
    );
    expect(a).toBe("q=x&role=USER&sort=name&order=asc&page=2");
  });
});
