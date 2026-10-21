import type { AdminRequestType } from "./types";

export const REQUEST_TYPE_LABELS: Record<AdminRequestType, string> = {
  REFUND: "Refund",
  EVENT_REFUND_ALL: "Refund all buyers",
  WALLET_ADJUSTMENT: "Wallet adjustment",
  PAYOUT_FORCE_FAIL: "Fail a payout",
  PAYOUTS_RESUME: "Resume payouts",
  PRIVILEGED_ROLE_CHANGE: "Admin role change",
};

/** Where a request's target lives in the console, if anywhere. */
export function requestTargetHref(targetType: string, targetId: string | null): string | null {
  if (!targetId) return targetType === "platform" ? "/payouts" : null;
  switch (targetType) {
    case "transaction":
      return `/transactions/${targetId}`;
    case "event":
      return `/events/${targetId}`;
    case "wallet":
      return `/wallets/${targetId}`;
    case "payout":
      return `/payouts/${targetId}`;
    case "user":
      return `/users/${targetId}`;
    default:
      return null;
  }
}
