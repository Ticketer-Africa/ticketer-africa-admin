"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon, Calendar01Icon, DashboardSquare01Icon, Logout03Icon, Moon02Icon, QrCodeScanIcon, ReceiptDollarIcon, Sun01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/lib/auth-context";

const navItems = [
  { name: "Overview", href: "/", icon: DashboardSquare01Icon },
  { name: "Scan Tickets", href: "/scan-tickets", icon: QrCodeScanIcon },
  { name: "Users", href: "/users", icon: UserGroupIcon },
  { name: "Events", href: "/events", icon: Calendar01Icon },
  { name: "Transactions", href: "/transactions", icon: ReceiptDollarIcon },
  { name: "Organizers", href: "/organizers", icon: Building02Icon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-sidebar-border font-mono text-xs text-sidebar-primary">
            TA
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">
              Ticketer
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
              Admin
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <HugeiconsIcon icon={item.icon} className="size-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3 px-4 py-4">
        <Separator className="bg-sidebar-border" />
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs text-sidebar-foreground">
              {user?.email}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-sidebar-foreground/50">
              {user?.role}
            </p>
          </div>
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {resolvedTheme === "dark" ? (
              <HugeiconsIcon icon={Sun01Icon} className="size-4" />
            ) : (
              <HugeiconsIcon icon={Moon02Icon} className="size-4" />
            )}
          </button>
        </div>
        <SidebarMenuButton onClick={logout}>
          <HugeiconsIcon icon={Logout03Icon} className="size-4" />
          <span>Log out</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
