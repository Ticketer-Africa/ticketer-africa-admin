"use client";

import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  CommandPalette,
  CommandPaletteProvider,
} from "@/components/command-palette";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { MobileTabBar } from "@/components/shell/mobile-tab-bar";
import { NavSheet } from "@/components/shell/nav-sheet";

export function AppShell({
  defaultSidebarOpen,
  children,
}: {
  defaultSidebarOpen: boolean;
  children: ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <CommandPaletteProvider>
        <a
          href="#main"
          className="sr-only z-toast rounded-md bg-surface px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:border focus:border-border"
        >
          Skip to content
        </a>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
          <main
            id="main"
            tabIndex={-1}
            className="flex-1 px-4 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+2rem)] pt-5 outline-none md:px-6 md:pb-12 md:pt-7 lg:px-8"
          >
            <div className="mx-auto w-full max-w-[90rem]">{children}</div>
          </main>
        </SidebarInset>
        <MobileTabBar />
        <NavSheet />
        <CommandPalette />
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
