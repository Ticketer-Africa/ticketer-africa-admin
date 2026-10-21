"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEventOptions } from "@/services/v2/transactions";

export interface PickedEvent {
  id: string;
  name: string;
}

interface EventPickerProps {
  value: PickedEvent | undefined;
  onChange: (event: PickedEvent | undefined) => void;
  /** Accessible name for the search box. */
  label?: string;
}

/**
 * Choose one event by searching its name (2+ characters), inline: a search
 * box with the matches listed under it, then the chosen event with a Change
 * button. For forms inside sheets. EventFilter opens a popover, and a
 * popover inside a sheet can't take keyboard focus (the dialog and popover
 * packages carry separate focus-trap stacks), so forms use this instead.
 */
export function EventPicker({ value, onChange, label = "Search events by name" }: EventPickerProps) {
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const listId = useId();
  // One search per pause in typing, not per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(term), 250);
    return () => clearTimeout(timer);
  }, [term]);
  const results = useEventOptions(query);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2">
        <span className="min-w-0 truncate text-sm font-medium text-foreground" title={value.name}>
          {value.name}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            onChange(undefined);
            setTerm("");
            setQuery("");
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  const tooShort = query.trim().length < 2;
  return (
    <div className="space-y-2">
      <Input
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search events by name"
        aria-label={label}
        aria-controls={listId}
        autoComplete="off"
      />
      <div id={listId} aria-live="polite">
        {tooShort ? (
          <p className="text-xs text-muted-foreground">Type at least 2 characters.</p>
        ) : results.isError ? (
          <p role="alert" className="text-xs text-destructive">
            Couldn&apos;t search events. Try again.
          </p>
        ) : results.isPending ? (
          <p className="text-xs text-muted-foreground">Searching…</p>
        ) : !results.data?.length ? (
          <p className="text-xs text-muted-foreground">No events match “{query.trim()}”.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {results.data.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onChange({ id: event.id, name: event.title })}
                  className="block min-h-10 w-full px-3 py-1.5 text-left transition-colors duration-state hover:bg-accent focus-visible:bg-accent focus-visible:outline-none md:min-h-9"
                >
                  <span className="block truncate text-sm text-foreground">{event.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{event.subtitle}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
