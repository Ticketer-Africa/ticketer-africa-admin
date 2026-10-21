"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  DashboardSquare01Icon,
  MoreHorizontalIcon,
  QrCodeScanIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useSidebar } from "@/components/ui/sidebar";
import { useCommandPalette } from "@/components/command-palette";
import { isNavItemActive } from "@/components/shell/nav-config";
import { useNavBadges } from "@/components/shell/use-nav-badges";
import { cn } from "@/lib/utils";

const itemClasses =
  "relative flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-state ease-out focus-visible:outline-offset-[-4px]";

function TabContent({
  icon,
  label,
  active,
  badge,
}: {
  icon: IconSvgElement;
  label: string;
  active: boolean;
  badge?: ReactNode;
}) {
  return (
    <>
      <span className="relative">
        <HugeiconsIcon
          icon={icon}
          className={cn("size-5", active ? "text-primary" : "text-muted-foreground")}
        />
        {badge}
      </span>
      <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </>
  );
}

/** Phone-only bottom bar: Overview, Search, Approvals, Scan, More. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { openMobile, setOpenMobile } = useSidebar();
  const palette = useCommandPalette();
  const approvals = useNavBadges().approvals;

  const links = {
    overview: isNavItemActive("/", pathname),
    approvals: isNavItemActive("/approvals", pathname),
    scan: isNavItemActive("/scan-tickets", pathname),
  };

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-nav border-t border-border bg-surface pb-safe md:hidden"
    >
      <ul className="grid h-tab-bar grid-cols-5">
        <li>
          <Link
            href="/"
            aria-current={links.overview ? "page" : undefined}
            className={itemClasses}
          >
            <TabContent icon={DashboardSquare01Icon} label="Overview" active={links.overview} />
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={(event) => palette.setOpen(true, event.currentTarget)}
            aria-haspopup="dialog"
            className={itemClasses}
          >
            <TabContent icon={Search01Icon} label="Search" active={palette.open} />
          </button>
        </li>
        <li>
          <Link
            href="/approvals"
            aria-current={links.approvals ? "page" : undefined}
            aria-label={approvals ? `Approvals, ${approvals} pending` : undefined}
            className={itemClasses}
          >
            <TabContent
              icon={CheckmarkBadge01Icon}
              label="Approvals"
              active={links.approvals}
              badge={
                approvals ? (
                  <span className="num absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-none text-primary-foreground ring-2 ring-surface">
                    {approvals > 99 ? "99+" : approvals}
                  </span>
                ) : null
              }
            />
          </Link>
        </li>
        <li>
          <Link
            href="/scan-tickets"
            aria-current={links.scan ? "page" : undefined}
            className={itemClasses}
          >
            <TabContent icon={QrCodeScanIcon} label="Scan" active={links.scan} />
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={(event) => setOpenMobile(true, event.currentTarget)}
            aria-haspopup="dialog"
            aria-expanded={openMobile}
            className={itemClasses}
          >
            <TabContent icon={MoreHorizontalIcon} label="More" active={openMobile} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
