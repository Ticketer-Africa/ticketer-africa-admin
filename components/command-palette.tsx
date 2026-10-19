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
import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
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

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
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
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((value) => !value), []);

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

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

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

/**
 * Global search. For now it jumps to any page and switches theme; record
 * search (users, events, references, ticket codes) is wired in Task 8.
 */
export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

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
          className={cn(
            "fixed inset-x-3 top-3 z-sheet mx-auto max-w-[36rem] overflow-hidden rounded-xl border border-border bg-popover shadow-overlay outline-none md:inset-x-4 md:top-[14vh]",
            "duration-150 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] data-[state=open]:slide-in-from-top-1",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Search and jump
          </DialogPrimitive.Title>
          <Command loop>
            <CommandInput
              placeholder="Jump to a page or run a command…"
              trailing={
                <Kbd className="hidden md:inline-flex" aria-hidden="true">
                  Esc
                </Kbd>
              }
            />
            <CommandList>
              <CommandEmpty>
                Nothing matches. Try a page name like “payouts” or “audit”.
              </CommandEmpty>
              <CommandGroup heading="Go to">
                {NAV.flatMap((group) => group.items).map((item) => (
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
