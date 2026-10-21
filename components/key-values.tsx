import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KeyValueItem {
  label: string;
  value: ReactNode;
  /** Geist Mono, tabular: references, amounts, dates. */
  mono?: boolean;
  /** Hide the row entirely (e.g. a field that doesn't apply). */
  hidden?: boolean;
}

interface KeyValuesProps {
  items: KeyValueItem[];
  /** Columns from 768px up; phones always stack label over value. */
  columns?: 1 | 2 | 3;
  className?: string;
}

/** Labelled facts about a record, as a description list. */
export function KeyValues({ items, columns = 2, className }: KeyValuesProps) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-3",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-3",
        className,
      )}
    >
      {items
        .filter((item) => !item.hidden)
        .map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd
              className={cn(
                "mt-0.5 break-words text-sm text-foreground",
                item.mono && "num",
              )}
            >
              {item.value ?? "—"}
            </dd>
          </div>
        ))}
    </dl>
  );
}
