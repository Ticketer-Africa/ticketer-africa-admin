"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarLeft01Icon } from "@hugeicons/core-free-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Kbd } from "@/components/ui/kbd";
import { BrandLockup } from "@/components/shell/brand-mark";
import { NAV, isNavItemActive } from "@/components/shell/nav-config";
import { useNavBadges } from "@/components/shell/use-nav-badges";
import { useModKey } from "@/components/shell/use-mod-key";

/** Desktop and tablet navigation. Hidden below 768px (phones use the nav sheet). */
export function AppSidebar() {
  const pathname = usePathname();
  const badges = useNavBadges();
  const { state, toggleSidebar } = useSidebar();
  const mod = useModKey();
  const collapsed = state === "collapsed";

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/"
          aria-label="Ticketer Africa admin, go to overview"
          className="flex min-w-0 items-center rounded-md px-1 py-1 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:px-0"
        >
          <BrandLockup hideTextWhenCollapsed />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Main">
          {NAV.map((group, index) => (
            <SidebarGroup key={group.group ?? `group-${index}`}>
              {group.group && <SidebarGroupLabel>{group.group}</SidebarGroupLabel>}
              <SidebarMenu>
                {group.items.map((item) => {
                  const count = item.badge ? badges[item.badge] : undefined;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isNavItemActive(item.href, pathname)}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <HugeiconsIcon icon={item.icon} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {count ? (
                        <SidebarMenuBadge aria-label={`${count} pending`}>
                          {count > 99 ? "99+" : count}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenuButton
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-keyshortcuts="Meta+B Control+B"
          tooltip={
            <>
              Expand sidebar
              <span className="opacity-70">{mod}B</span>
            </>
          }
        >
          <HugeiconsIcon icon={SidebarLeft01Icon} />
          <span>Collapse</span>
          <Kbd className="ml-auto group-data-[collapsible=icon]:hidden">{mod}B</Kbd>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
