"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useSidebar } from "@/components/ui/sidebar";
import { useCommandPalette } from "@/components/command-palette";
import { AccountMenu, ThemeMenu } from "@/components/shell/account";
import { findNavEntry } from "@/components/shell/nav-config";
import { useModKey } from "@/components/shell/use-mod-key";
import { usePageTitleVisible } from "@/components/shell/use-page-title-visible";
import { cn } from "@/lib/utils";

function Slash() {
  return (
    <li aria-hidden="true" className="select-none text-border">
      /
    </li>
  );
}

/**
 * Desktop: breadcrumb, search trigger, theme, account.
 * Phone: menu button (nav sheet), page title, search icon.
 */
export function TopBar() {
  const pathname = usePathname();
  const entry = findNavEntry(pathname);
  const isSubpage = Boolean(entry && pathname !== entry.item.href);
  const title = entry?.item.label ?? "Admin";
  const { setOpenMobile } = useSidebar();
  const palette = useCommandPalette();
  const mod = useModKey();
  const pageTitleVisible = usePageTitleVisible(pathname);

  return (
    <header className="sticky top-0 z-sticky flex h-top-bar shrink-0 items-center gap-1 border-b border-border bg-background px-1.5 md:gap-2 md:px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={() => setOpenMobile(true)}
      >
        <HugeiconsIcon icon={Menu01Icon} />
      </Button>

      <div className="min-w-0 flex-1">
        <p
          aria-hidden={pageTitleVisible}
          className={cn(
            "truncate text-lg font-semibold text-foreground transition-opacity duration-state ease-out md:hidden",
            pageTitleVisible ? "opacity-0" : "opacity-100",
          )}
        >
          {title}
        </p>

        <nav aria-label="Breadcrumb" className="hidden md:block">
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            {entry?.group && (
              <>
                <li className="shrink-0 text-muted-foreground">{entry.group}</li>
                <Slash />
              </>
            )}
            <li className="min-w-0 truncate">
              {isSubpage ? (
                <Link
                  href={entry!.item.href}
                  className="rounded-sm text-muted-foreground transition-colors duration-state hover:text-foreground"
                >
                  {title}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-foreground">
                  {title}
                </span>
              )}
            </li>
            {isSubpage && (
              <>
                <Slash />
                <li aria-current="page" className="truncate font-medium text-foreground">
                  Details
                </li>
              </>
            )}
          </ol>
        </nav>
      </div>

      <button
        type="button"
        onClick={() => palette.setOpen(true)}
        aria-keyshortcuts="Meta+K Control+K"
        className="hidden h-8 w-56 items-center gap-2 rounded-md border border-input bg-surface pl-2.5 pr-1.5 text-sm text-muted-foreground transition-colors duration-state ease-out hover:bg-accent/60 hover:text-foreground md:flex lg:w-72"
      >
        <HugeiconsIcon icon={Search01Icon} className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">Search or jump to…</span>
        <Kbd>{mod}K</Kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search"
        onClick={() => palette.setOpen(true)}
      >
        <HugeiconsIcon icon={Search01Icon} />
      </Button>

      <div className="hidden items-center gap-1 md:flex">
        <ThemeMenu />
        <AccountMenu />
      </div>
    </header>
  );
}
