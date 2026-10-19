import type { IconSvgElement } from "@hugeicons/react";
import {
  Analytics01Icon,
  ArrowDataTransferHorizontalIcon,
  ArrowTurnBackwardIcon,
  Building02Icon,
  Calendar03Icon,
  CheckmarkBadge01Icon,
  DashboardSquare01Icon,
  DiscountTag01Icon,
  MoneySend02Icon,
  QrCodeScanIcon,
  Settings02Icon,
  Ticket02Icon,
  UserMultipleIcon,
  Wallet01Icon,
  WorkHistoryIcon,
} from "@hugeicons/core-free-icons";

export type NavBadge = "approvals";

export interface NavItem {
  href: string;
  label: string;
  icon: IconSvgElement;
  badge?: NavBadge;
}

export interface NavGroup {
  group: string | null;
  items: NavItem[];
}

/** Sidebar, nav sheet and command palette all read from this. Order per spec. */
export const NAV: NavGroup[] = [
  {
    group: null,
    items: [
      { href: "/", label: "Overview", icon: DashboardSquare01Icon },
      { href: "/analytics", label: "Analytics", icon: Analytics01Icon },
    ],
  },
  {
    group: "Money",
    items: [
      { href: "/transactions", label: "Transactions", icon: ArrowDataTransferHorizontalIcon },
      { href: "/refunds", label: "Refunds", icon: ArrowTurnBackwardIcon },
      { href: "/payouts", label: "Payouts", icon: MoneySend02Icon },
      { href: "/wallets", label: "Wallets", icon: Wallet01Icon },
    ],
  },
  {
    group: "Platform",
    items: [
      { href: "/events", label: "Events", icon: Calendar03Icon },
      { href: "/organizers", label: "Organizers", icon: Building02Icon },
      { href: "/users", label: "Users", icon: UserMultipleIcon },
      { href: "/tickets", label: "Tickets", icon: Ticket02Icon },
      { href: "/promo-codes", label: "Promo codes", icon: DiscountTag01Icon },
    ],
  },
  {
    group: "Control",
    items: [
      { href: "/approvals", label: "Approvals", icon: CheckmarkBadge01Icon, badge: "approvals" },
      { href: "/audit", label: "Audit log", icon: WorkHistoryIcon },
      { href: "/settings", label: "Team & settings", icon: Settings02Icon },
    ],
  },
  {
    group: null,
    items: [{ href: "/scan-tickets", label: "Scan tickets", icon: QrCodeScanIcon }],
  },
];

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The nav entry (and its group) that owns a path, e.g. /users/abc → Users. */
export function findNavEntry(
  pathname: string,
): { group: string | null; item: NavItem } | null {
  for (const group of NAV) {
    for (const item of group.items) {
      if (isNavItemActive(item.href, pathname)) {
        return { group: group.group, item };
      }
    }
  }
  return null;
}
