import { useMemo, useState } from "react";

export function useTableSearch<T>(
  rows: T[] | undefined,
  getSearchValue: (row: T) => string,
) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => getSearchValue(row).toLowerCase().includes(q));
  }, [rows, query, getSearchValue]);

  return { query, setQuery, filtered };
}
