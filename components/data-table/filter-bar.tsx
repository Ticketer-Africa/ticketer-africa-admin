"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  /** Free-text search, written to the URL 300ms after typing stops. */
  search?: {
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    placeholder: string;
  };
  /** FilterSelect, DateRangePicker, … */
  children?: ReactNode;
  /** How many filters (including search) differ from the defaults. */
  activeCount?: number;
  onClear?: () => void;
  className?: string;
}

export function FilterBar({ search, children, activeCount = 0, onClear, className }: FilterBarProps) {
  return (
    <div
      role="search"
      className={cn("mb-3 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center", className)}
    >
      {search && <SearchInput {...search} />}
      {(children || (onClear && activeCount > 0)) && (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {children}
          {onClear && activeCount > 0 && (
            <Button variant="muted" onClick={onClear}>
              <HugeiconsIcon icon={Cancel01Icon} />
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

const SEARCH_DELAY_MS = 300;

function SearchInput({
  value,
  onChange,
  placeholder,
}: NonNullable<FilterBarProps["search"]>) {
  const current = value ?? "";
  const [text, setText] = useState(current);
  // The URL value last seen, and the value this input last wrote to it.
  const [seen, setSeen] = useState(current);
  const [written, setWritten] = useState(current);

  // Follow the URL when it changes from elsewhere (Clear filters, back
  // button), but not when it's just our own write landing.
  if (current !== seen) {
    setSeen(current);
    if (current !== written) {
      setWritten(current);
      setText(current);
    }
  }

  useEffect(() => {
    const next = text.trim();
    if (next === written) return;
    const timer = setTimeout(() => {
      setWritten(next);
      onChange(next || undefined);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, written, onChange]);

  return (
    <div className="relative w-full md:w-72">
      <HugeiconsIcon
        icon={Search01Icon}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground md:left-2.5"
      />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="pl-9 md:pl-8"
      />
    </div>
  );
}

const ANY = "__any__";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  /** Shown before the value: "Role". */
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: FilterOption[];
  /** The "no filter" choice: "Any role". */
  anyLabel?: string;
  className?: string;
}

/** A pill-like select whose "Any" choice clears the filter. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  anyLabel = "Any",
  className,
}: FilterSelectProps) {
  const selected = options.find((option) => option.value === value);
  return (
    <Select value={selected ? selected.value : ANY} onValueChange={(next) => onChange(next === ANY ? undefined : next)}>
      <SelectTrigger
        // A combobox doesn't take its name from its content.
        aria-label={`${label}: ${selected ? selected.label : anyLabel}`}
        className={cn(
          "w-auto min-w-0 max-w-full gap-1.5",
          selected && "border-primary/60 bg-primary/5",
          className,
        )}
      >
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(selected ? "font-medium text-foreground" : "text-muted-foreground")}>
          {selected ? selected.label : "Any"}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{anyLabel}</SelectItem>
        <SelectSeparator />
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
