"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  ComputerIcon,
  Moon02Icon,
  Search01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { NAV } from "@/components/shell/nav-config";
import { cn } from "@/lib/utils";
import { createFocusReturn } from "@/lib/focus-return";
import {
  readRecent,
  rememberRecent,
  SEARCH_GROUP_LABELS,
  useGlobalSearch,
  type SearchGroup,
  type SearchHit,
} from "@/services/v2/search";

interface CommandPaletteContextValue {
  open: boolean;
  /** `opener` is where focus returns on close (defaults to the focused element). */
  setOpen: (open: boolean, opener?: Element | null) => void;
  toggle: () => void;
  onCloseAutoFocus: (event: Event) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider.",
    );
  }
  return context;
}

/** Holds the palette's open state and binds ⌘K / Ctrl K. */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [focusReturn] = useState(createFocusReturn);

  const setOpen = useCallback(
    (next: boolean, opener?: Element | null) => {
      if (next) focusReturn.capture(opener);
      setOpenState(next);
    },
    [focusReturn],
  );
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const value = useMemo(
    () => ({ open, setOpen, toggle, onCloseAutoFocus: focusReturn.restore }),
    [open, setOpen, toggle, focusReturn],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "system", label: "Match system", icon: ComputerIcon },
] as const;

const GROUP_ORDER: SearchGroup[] = [
  "transactions",
  "tickets",
  "users",
  "organizers",
  "events",
  "payouts",
];

/**
 * Global search: from 2 characters it searches records (payment
 * references, ticket codes, emails, names) on the server; pages and theme
 * are always there. With nothing typed it shows recently opened records.
 */
export function CommandPalette() {
  const { open, setOpen, onCloseAutoFocus } = useCommandPalette();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-overlay bg-[oklch(0.18_0.015_255/0.32)] dark:bg-[oklch(0_0_0/0.55)]",
            "duration-150 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            "fixed inset-x-3 top-3 z-sheet mx-auto max-w-[36rem] overflow-hidden rounded-xl border border-border bg-popover shadow-overlay outline-none md:inset-x-4 md:top-[14vh]",
            "duration-150 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] data-[state=open]:slide-in-from-top-1",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Search and jump
          </DialogPrimitive.Title>
          {/* Mounted per open, so the search starts empty every time. */}
          <PaletteBody onDone={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PaletteBody({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [recent] = useState<SearchHit[]>(readRecent);
  // One request per pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(term), 200);
    return () => clearTimeout(timer);
  }, [term]);
  const searching = term.trim().length >= 2;
  const results = useGlobalSearch(query);
  const lower = term.trim().toLowerCase();
  const pages = NAV.flatMap((group) => group.items).filter(
    (item) => !searching || item.label.toLowerCase().includes(lower),
  );
  // Hits from an earlier term would let Enter open the wrong record, so only
  // show results that answer exactly what's typed now.
  const fresh = query.trim() === term.trim() && !results.isPlaceholderData;
  const groups = fresh
    ? GROUP_ORDER.filter((group) => (results.data?.[group]?.length ?? 0) > 0)
    : [];

  const run = (action: () => void) => {
    onDone();
    action();
  };
  const openRecord = (hit: SearchHit) =>
    run(() => {
      rememberRecent(hit);
      router.push(hit.href);
    });

  // While searching, the server filters; cmdk only filters pages and theme.
  return (
    <Command loop shouldFilter={!searching}>
      <CommandInput
        value={term}
        onValueChange={setTerm}
        placeholder="Search payments, tickets, people, events… or jump to a page"
        trailing={
          <Kbd className="hidden md:inline-flex" aria-hidden="true">
            Esc
          </Kbd>
        }
      />
      <CommandList>
        <CommandEmpty>
          {searching && (results.isFetching || !fresh)
            ? "Searching…"
            : searching && results.isError
              ? "Search didn't work. Try again."
              : "Nothing matches. Try a payment reference, ticket code, email or name."}
        </CommandEmpty>
        {!searching && recent.length > 0 && (
          <CommandGroup heading="Recently opened">
            {recent.map((hit) => (
              <CommandItem
                key={hit.href}
                value={`recent ${hit.title} ${hit.subtitle}`}
                onSelect={() => openRecord(hit)}
              >
                <HugeiconsIcon icon={Clock01Icon} />
                <span className="min-w-0 flex-1 truncate">
                  {hit.title}
                </span>
                <span className="num max-w-[45%] truncate text-xs text-muted-foreground">
                  {hit.subtitle}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {searching &&
          groups.map((group) => (
            <CommandGroup
              key={group}
              heading={SEARCH_GROUP_LABELS[group]}
            >
              {results.data![group].map((hit) => (
                <CommandItem
                  key={hit.href}
                  value={hit.href}
                  onSelect={() => openRecord(hit)}
                >
                  <HugeiconsIcon icon={Search01Icon} />
                  <span className="min-w-0 flex-1 truncate">
                    {hit.title}
                  </span>
                  <span className="num max-w-[50%] truncate text-xs text-muted-foreground">
                    {hit.subtitle}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        {pages.length > 0 && (
          <CommandGroup heading="Go to">
            {pages.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                keywords={[item.href.replace(/[/-]/g, " ")]}
                onSelect={() => run(() => router.push(item.href))}
              >
                <HugeiconsIcon icon={item.icon} />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!searching && (
          <CommandGroup heading="Theme">
            {THEMES.map((option) => (
              <CommandItem
                key={option.value}
                value={`Theme ${option.label}`}
                keywords={["appearance", "dark mode", "light mode"]}
                onSelect={() => run(() => setTheme(option.value))}
              >
                <HugeiconsIcon icon={option.icon} />
                <span>{option.label}</span>
                {theme === option.value && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Current
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      <div className="hidden items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground md:flex">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          to move
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          to open
        </span>
      </div>
    </Command>
  );
}
