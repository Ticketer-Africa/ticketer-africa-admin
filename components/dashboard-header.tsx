"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const titles: Record<string, string> = {
  "/": "Overview",
  "/users": "Users",
  "/events": "Events",
  "/transactions": "Transactions",
  "/organizers": "Organizers",
};

function resolveTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  const section = Object.keys(titles).find(
    (path) => path !== "/" && pathname.startsWith(path),
  );
  return section ? titles[section] : "Admin";
}

export function DashboardHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="text-sm font-medium tracking-tight">
        {resolveTitle(pathname)}
      </h1>
    </header>
  );
}
