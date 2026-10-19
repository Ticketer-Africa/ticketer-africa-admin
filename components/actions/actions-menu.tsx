"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TIER_HINT, type ActionTier } from "./action-sheet";

export interface ActionsMenuItem {
  /** Stable id; also what `onSelect` receives. */
  key: string;
  label: string;
  tier: ActionTier;
  /** Shown but not selectable, with `note` saying why. */
  disabled?: boolean;
  note?: string;
  destructive?: boolean;
}

interface ActionsMenuProps {
  /** Only the actions that apply to the record now (plus disabled ones worth explaining). */
  items: ActionsMenuItem[];
  /** Opens the matching ActionSheet (controlled). */
  onSelect: (key: string) => void;
  label?: string;
}

/**
 * A detail page's Actions menu: tier 2 and 3 actions, each labelled with
 * what it needs ("Needs a reason", "Needs approval"). Selecting one opens
 * its sheet, which the page keeps mounted with a stable key.
 * Renders nothing when no action applies.
 */
export function ActionsMenu({ items, onSelect, label = "Actions" }: ActionsMenuProps) {
  if (items.length === 0) return null;
  return (
    // Not modal: a modal menu closing while the sheet opens can leave the
    // page with pointer events off.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" data-actions-menu-trigger="">
          {label}
          <HugeiconsIcon icon={ArrowDown01Icon} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={16} className="w-[min(21rem,calc(100vw-2rem))]">
        {items.map((item) => {
          const hint = TIER_HINT[item.tier];
          return (
            <DropdownMenuItem
              key={item.key}
              disabled={item.disabled}
              variant={item.destructive ? "destructive" : "default"}
              onSelect={() => onSelect(item.key)}
              className={cn(
                "h-auto min-h-9 flex-col items-start gap-0.5 py-1.5 md:h-auto md:min-h-8",
                // Keep the explanation readable on a disabled item.
                item.disabled && "data-[disabled]:opacity-100",
              )}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className={cn("min-w-0", item.disabled && "text-muted-foreground")}>{item.label}</span>
                {hint && <span className="shrink-0 text-xs text-muted-foreground">{hint}</span>}
              </span>
              {item.note && <span className="text-xs text-muted-foreground">{item.note}</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
