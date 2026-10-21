import type { NavBadge } from "@/components/shell/nav-config";
import { usePendingCount } from "@/services/v2/requests";

/** Counts shown on nav items: approval requests waiting for a decision. */
export function useNavBadges(): Partial<Record<NavBadge, number>> {
  const pending = usePendingCount();
  return pending.data ? { approvals: pending.data } : {};
}
