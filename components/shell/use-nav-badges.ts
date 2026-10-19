import type { NavBadge } from "@/components/shell/nav-config";

/**
 * Counts shown on nav items. The approvals count comes from
 * `usePendingCount()` once the v2 requests endpoint exists (Task 8); until
 * then nothing is shown.
 */
export function useNavBadges(): Partial<Record<NavBadge, number>> {
  return {};
}
