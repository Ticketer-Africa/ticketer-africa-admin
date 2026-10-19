"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEventOptions } from "@/services/v2/transactions";

const ANY = "__any__";

interface EventFilterProps {
  /** The selected event id. */
  value: string | undefined;
  onChange: (eventId: string | undefined) => void;
  className?: string;
}

/**
 * "Event: Any" pill that opens a search box over events (name or slug,
 * 2+ characters). The selected event's name is looked up by its id, so a
 * pasted link shows the name too.
 */
export function EventFilter({ value, onChange, className }: EventFilterProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  // One search per pause in typing, not per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(term), 250);
    return () => clearTimeout(timer);
  }, [term]);
  const results = useEventOptions(query);
  // An exact id search returns that event first.
  const selected = useEventOptions(value ?? "");
  const selectedName = value
    ? (selected.data?.find((event) => event.id === value)?.title ??
      (selected.isPending || selected.isPlaceholderData ? "Loading…" : "Unknown event"))
    : undefined;

  function choose(next: string | undefined) {
    onChange(next);
    setOpen(false);
    setTerm("");
    setQuery("");
  }

  const tooShort = query.trim().length < 2;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          aria-label={`Event: ${selectedName ?? "Any event"}`}
          className={cn(
            "min-w-0 max-w-full justify-start",
            value && "border-primary/60 bg-primary/5",
            className,
          )}
        >
          <span className="text-muted-foreground">Event</span>
          <span
            className={cn(
              "max-w-[14rem] truncate",
              value ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {selectedName ?? "Any"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <Command shouldFilter={false} label="Find an event">
          <CommandInput
            value={term}
            onValueChange={setTerm}
            placeholder="Search events by name"
            className="h-10 text-sm md:text-sm"
          />
          <CommandList className="max-h-72">
            {value && (
              <CommandGroup>
                <CommandItem value={ANY} onSelect={() => choose(undefined)}>
                  Any event
                </CommandItem>
              </CommandGroup>
            )}
            {tooShort ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters.
              </p>
            ) : results.isError ? (
              <p role="alert" className="px-3 py-6 text-center text-sm text-destructive">
                Couldn&apos;t search events. Try again.
              </p>
            ) : results.isPending ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Searching…</p>
            ) : !results.data?.length ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No events match “{query.trim()}”.
              </p>
            ) : (
              <CommandGroup heading="Events">
                {results.data.map((event) => (
                  <CommandItem
                    key={event.id}
                    value={event.id}
                    onSelect={() => choose(event.id)}
                    className="h-auto min-h-10 py-1.5 md:min-h-9"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{event.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {event.subtitle}
                      </span>
                    </span>
                    {event.id === value && <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
