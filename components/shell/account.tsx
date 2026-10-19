"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ComputerIcon,
  Logout03Icon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const THEME_OPTIONS = [
  { value: "system", label: "System", icon: ComputerIcon },
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
] as const;

export type ThemeValue = (typeof THEME_OPTIONS)[number]["value"];

export function roleLabel(role: string | undefined): string {
  if (role === "SUPERADMIN") return "Superadmin";
  if (role === "ADMIN") return "Admin";
  return "Staff";
}

export function initials(name: string | undefined, email?: string): string {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export function Avatar({
  name,
  email,
  className,
}: {
  name?: string;
  email?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 select-none items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-foreground",
        // Blank (not "?") while the session loads.
        !name && !email && "animate-pulse",
        className,
      )}
    >
      {initials(name, email)}
    </span>
  );
}

/** Light / dark / system switch for the desktop top bar. */
export function ThemeMenu() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="muted" size="icon" aria-label="Change theme">
          <HugeiconsIcon icon={Sun03Icon} className="dark:hidden" />
          <HugeiconsIcon icon={Moon02Icon} className="hidden dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={(value) => setTheme(value)}
        >
          {THEME_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <HugeiconsIcon icon={option.icon} />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Who's signed in, their role, and sign out. */
export function AccountMenu() {
  const { user, logout } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={user ? `Account: ${user.name}` : "Account"}
        >
          <Avatar name={user?.name} email={user?.email} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-start gap-3 px-2 py-2">
          <Avatar name={user?.name} email={user?.email} className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.name ?? "Signed in"}
            </p>
            <p
              className="truncate text-xs text-muted-foreground"
              title={user?.email}
            >
              {user?.email}
            </p>
          </div>
          {user && (
            <Badge variant={user.role === "SUPERADMIN" ? "primary" : "neutral"}>
              {roleLabel(user.role)}
            </Badge>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <HugeiconsIcon icon={Logout03Icon} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
