"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "./client";
import type { AuditEntry, Paged } from "./types";

export const auditKey = ["v2", "audit"] as const;

/** The newest admin actions on one record, for its Activity section. */
export function useRecordActivity(
  targetType: string,
  targetId: string | undefined,
  pageSize = 20,
) {
  return useQuery({
    queryKey: [...auditKey, "for", targetType, targetId, pageSize],
    queryFn: () =>
      adminGet<Paged<AuditEntry>>("/audit", { targetType, targetId, pageSize }),
    enabled: Boolean(targetId),
  });
}

/** The newest admin actions anywhere, for the overview. */
export function useRecentActivity(limit = 8) {
  return useQuery({
    queryKey: [...auditKey, "recent", limit],
    queryFn: () =>
      adminGet<Paged<AuditEntry>>("/audit", { sort: "createdAt", order: "desc", pageSize: limit }),
    refetchInterval: 60_000,
  });
}

/** Everything recorded for one approval request (asked, decided, ran). */
export function useRequestActivity(requestId: string | undefined) {
  return useQuery({
    queryKey: [...auditKey, "request", requestId],
    queryFn: () =>
      adminGet<Paged<AuditEntry>>("/audit", { requestId, pageSize: 50, order: "asc" }),
    enabled: Boolean(requestId),
  });
}
