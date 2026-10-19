"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Logout03Icon } from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useSidebar } from "@/components/ui/sidebar";
import { BrandLockup } from "@/components/shell/brand-mark";
import { NAV, isNavItemActive } from "@/components/shell/nav-config";
import { useNavBadges } from "@/components/shell/use-nav-badges";
import {
  Avatar,
  THEME_OPTIONS,
  roleLabel,
  type ThemeValue,
} from "@/components/shell/account";
import { useUser } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

/** Phone navigation: every page, plus account and theme. */
export function NavSheet() {
  const pathname = usePathname();
  const { openMobile, setOpenMobile } = useSidebar();
  const badges = useNavBadges();
  const { user, logout } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        side="left"
        hideClose
        aria-describedby={undefined}
        className="bg-sidebar p-0"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-top-bar shrink-0 items-center justify-between border-b border-sidebar-border pl-4 pr-1.5">
          <BrandLockup />
          <SheetClose asChild>
            <Button variant="muted" size="icon" aria-label="Close navigation">
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </SheetClose>
        </div>

        <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {NAV.map((group, index) => (
            <div key={group.group ?? `group-${index}`} className="py-1.5">
              {group.group && (
                <p className="flex h-7 items-center px-2 text-xs font-medium text-muted-foreground">
                  {group.group}
                </p>
              )}
              <ul className="flex flex-col gap-px">
                {group.items.map((item) => {
                  const active = isNavItemActive(item.href, pathname);
                  const count = item.badge ? badges[item.badge] : undefined;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-10 items-center gap-3 rounded-md px-2 text-base text-sidebar-foreground transition-colors duration-state ease-out",
                          "hover:bg-sidebar-accent/70 focus-visible:outline-offset-[-2px]",
                          active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                        )}
                      >
                        <HugeiconsIcon
                          icon={item.icon}
                          className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {count ? (
                          <span className="num flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                            {count > 99 ? "99+" : count}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-sidebar-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 px-1">
            <Avatar name={user?.name} email={user?.email} className="size-8" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name ?? "Signed in"}
              </p>
              <p className="truncate text-xs text-muted-foreground" title={user?.email}>
                {user ? `${roleLabel(user.role)} · ${user.email}` : ""}
              </p>
            </div>
          </div>
          <Segmented<ThemeValue>
            aria-label="Theme"
            block
            value={(theme as ThemeValue | undefined) ?? "system"}
            onValueChange={setTheme}
            options={THEME_OPTIONS}
          />
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setOpenMobile(false);
              void logout();
            }}
          >
            <HugeiconsIcon icon={Logout03Icon} />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
